import { prisma } from '../../lib/prisma';
import { forbidden, notFound } from '../../lib/errors';
import { sendPqrResponseNotification } from '../../lib/mailer';

export interface PqrActor {
  id: string;
  role: string;
}

const staffRoles = new Set(['admin', 'superadmin']);
const pqrInclude = {
  customer: { select: { id: true, fullName: true, email: true } },
  respondedBy: { select: { id: true, fullName: true } },
};

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

  create(data: { type: 'petition' | 'complaint' | 'claim'; subject: string; description: string }, actor: PqrActor) {
    if (actor.role !== 'client') throw forbidden('Solo los clientes pueden crear un PQR.');

    return prisma.pqrRequest.create({
      data: {
        customerId: actor.id,
        type: data.type,
        subject: data.subject,
        description: data.description,
      },
      include: pqrInclude,
    });
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

    const current = await prisma.pqrRequest.findUnique({
      where: { id },
      include: { customer: { select: { fullName: true, email: true } } },
    });
    if (!current) throw notFound('PQR no encontrado.');

    const response = data.response?.trim();
    const updated = await prisma.pqrRequest.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.response !== undefined ? { response } : {}),
        ...(response ? { respondedById: actor.id, respondedAt: new Date() } : {}),
      },
      include: pqrInclude,
    });

    // El cambio queda guardado aunque el servidor de correo esté temporalmente caído.
    const hasNewResponse = Boolean(response) && response !== (current.response ?? '').trim();
    if (hasNewResponse) {
      const mailResult = await sendPqrResponseNotification(
        current.customer.email,
        current.customer.fullName,
        updated.subject,
        response!,
      );
      if (!mailResult.sent) {
        console.error(`[pqr] La respuesta ${id} quedó guardada, pero no se pudo enviar el aviso por correo: ${mailResult.error ?? 'error desconocido'}`);
      }
    }

    return updated;
  },
};
