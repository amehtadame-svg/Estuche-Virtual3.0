import { atomic, requestLock } from '../employee/employee.domain';
import { prisma } from '../../lib/prisma';
import { forbidden, notFound, conflict, tooManyRequests } from '../../lib/errors';
import { sendNewPqrNotification, sendPqrResponseNotification } from '../../lib/mailer';

export interface PqrActor {
  id: string;
  role: string;
}

const staffRoles = new Set(['admin', 'superadmin']);
const pqrInclude = {
  customer: { select: { id: true, fullName: true, email: true } },
  respondedBy: { select: { id: true, fullName: true } },
};

// El correo oficial fue confirmado como destinatario por la administración.
const PQR_OFFICIAL_EMAIL = 'estuchevirtual272@gmail.com';

async function notifyTeamOfNewPqr(id: string, type: 'petition' | 'complaint' | 'claim', subject: string, createdAt: Date) {
  const addresses = new Set<string>([PQR_OFFICIAL_EMAIL]);
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'superadmin'] }, isActive: true, deletedAt: null },
      select: { email: true },
    });
    for (const { email } of admins) {
      const clean = email.trim().toLowerCase();
      if (/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(clean)) addresses.add(clean);
      else console.error('[pqr] Se omitió un correo administrativo inválido.');
    }
  } catch {
    // Intentar igualmente la dirección oficial si falla la consulta de personal.
    console.error('[pqr] No se pudieron consultar los destinatarios administrativos.');
  }
  let failed = 0;
  const recipients = [...addresses];
  // Lotes pequeños para no abrir una conexión por cada administrador a la vez.
  for (let i = 0; i < recipients.length; i += 3) {
    const results = await Promise.all(recipients.slice(i, i + 3).map(
      (recipient) => sendNewPqrNotification(recipient, id, type, subject, createdAt)
    ));
    failed += results.filter((result) => !result.sent).length;
  }
  if (failed) console.error(`[pqr] El PQR ${id} quedó registrado, pero ${failed} aviso(s) no fueron aceptados por SMTP. No hay reintento automático.`);
}

export const pqrService = {
  list(actor: PqrActor) {
    if (staffRoles.has(actor.role)) {
      return prisma.pqrRequest.findMany({
        include: pqrInclude,
        orderBy: { createdAt: 'desc' },
      });
    }

    if (actor.role !== 'client') throw forbidden('Solo los clientes pueden consultar sus PQR.');

    return prisma.pqrRequest.findMany({
      where: { customerId: actor.id },
      include: pqrInclude,
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: { type: 'petition' | 'complaint' | 'claim'; subject: string; description: string }, actor: PqrActor) {
    if (actor.role !== 'client') throw forbidden('Solo los clientes pueden crear un PQR.');

    const created = await atomic(async tx => {
      // Un bloqueo por cliente protege también doble clic, pestañas y procesos distintos.
      await requestLock(tx, `pqr:${actor.id}`);
      const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
      const previous = await tx.pqrRequest.findMany({ where: { customerId: actor.id },
        select: { id: true, type: true, subject: true, description: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
      const duplicate = previous.find(item => item.type === data.type && normalize(item.subject) === normalize(data.subject) && normalize(item.description) === normalize(data.description));
      if (duplicate) throw conflict('Ya enviaste este PQR. Puedes consultar su seguimiento en Mis PQR.', { existingId: duplicate.id });
      const latest = previous[0];
      const retryAfter = latest ? Math.ceil((latest.createdAt.getTime() + 60000 - Date.now()) / 1000) : 0;
      if (retryAfter > 0) throw tooManyRequests(`Espera ${retryAfter} segundos antes de enviar otro PQR.`, { retryAfter });
      return tx.pqrRequest.create({ data: { customerId: actor.id, type: data.type, subject: data.subject.trim(), description: data.description.trim() }, include: pqrInclude });
    });

    // El PQR se confirma por su registro, no por el resultado del correo.
    // La notificación ocurre después de guardar y no bloquea la respuesta al cliente.
    void notifyTeamOfNewPqr(created.id, created.type, created.subject, created.createdAt).catch(() => {
      console.error(`[pqr] El PQR ${created.id} quedó registrado, pero falló el aviso al equipo.`);
    });
    return created;
  },

  async getById(id: string, actor: PqrActor) {
    const pqr = await prisma.pqrRequest.findUnique({ where: { id }, include: pqrInclude });
    if (!pqr) throw notFound('PQR no encontrado.');
    if (actor.role === 'client' && pqr.customerId !== actor.id) {
      throw forbidden('No puedes consultar un PQR de otra persona.');
    }
    if (!staffRoles.has(actor.role) && actor.role !== 'client') {
      throw forbidden('No tienes permiso para consultar este PQR.');
    }
    return pqr;
  },

  async update(
    id: string,
    data: { status: 'received' | 'in_progress' | 'answered' | 'closed'; response?: string },
    actor: PqrActor,
  ) {
    if (!staffRoles.has(actor.role)) throw forbidden('Solo Admin y SuperAdmin pueden gestionar los PQR.');

    const outcome = await prisma.$transaction(async (tx) => {
      // Serializa cambios simultáneos para comparar contra el último estado guardado.
      await tx.$queryRaw`SELECT id FROM pqr_requests WHERE id = ${id}::uuid FOR UPDATE`;
      const current = await tx.pqrRequest.findUnique({ where: { id }, include: pqrInclude });
      if (!current) throw notFound('PQR no encontrado.');

      const response = data.response?.trim();
      const responseChanged = response !== undefined && response !== (current.response ?? '').trim();
      const hasNewResponse = responseChanged && Boolean(response);
      const statusChanged = data.status !== current.status;
      if (!statusChanged && !responseChanged) {
        return { updated: current, hasNewResponse: false, statusChanged: false };
      }

      const updated = await tx.pqrRequest.update({
        where: { id },
        data: {
          status: data.status,
          ...(responseChanged ? { response } : {}),
          ...(hasNewResponse ? { respondedById: actor.id, respondedAt: new Date() } : {}),
          ...(responseChanged && !response ? { respondedById: null, respondedAt: null } : {}),
        },
        include: pqrInclude,
      });
      return { updated, hasNewResponse, statusChanged };
    });

    if (outcome.hasNewResponse || outcome.statusChanged) {
      // El registro ya está guardado; una falla de correo no lo revierte ni lo duplica.
      void sendPqrResponseNotification(
        outcome.updated.customer.email,
        outcome.updated.customer.fullName,
        outcome.updated.subject,
        outcome.hasNewResponse ? outcome.updated.response ?? undefined : undefined,
        outcome.updated.status,
      ).then((mailResult) => {
        if (!mailResult.sent) console.error(`[pqr] La actualización ${id} quedó guardada, pero el aviso al cliente no fue aceptado por SMTP. No hay reintento automático.`);
      }).catch(() => {
        console.error(`[pqr] La actualización ${id} quedó guardada, pero falló el aviso al cliente.`);
      });
    }

    return outcome.updated;
  },
};
