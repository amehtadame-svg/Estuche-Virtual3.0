import { prisma } from '../../lib/prisma';
import { forbidden, notFound } from '../../lib/errors';
import { Actor, isSupervisor } from '../employee/employee.domain';

function checkRole(actor: Actor) {
  if (actor.role !== 'employee' && !isSupervisor(actor)) throw forbidden('Acceso exclusivo para empleados y administración.');
}
const person = { id: true, fullName: true, role: true } as const;
const include = { creator: { select: person }, messages: { include: { sender: { select: person } }, orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }] } };

export const supportService = {
  async list(actor: Actor) {
    checkRole(actor);
    return prisma.supportThread.findMany({
      where: isSupervisor(actor) ? {} : { creatorId: actor.id },
      include: { creator: { select: person }, _count: { select: { messages: true } } },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }], take: 100,
    });
  },
  async get(id: string, actor: Actor) {
    checkRole(actor);
    const thread = await prisma.supportThread.findFirst({ where: { id, ...(isSupervisor(actor) ? {} : { creatorId: actor.id }) }, include });
    if (!thread) throw notFound('Conversación no encontrada.');
    return thread;
  },
  async create(subject: string, body: string, actor: Actor) {
    checkRole(actor);
    if (actor.role !== 'employee') throw forbidden('Solo los empleados pueden iniciar solicitudes.');
    return prisma.supportThread.create({ data: { creatorId: actor.id, subject, messages: { create: { senderId: actor.id, body } } }, include });
  },
  async reply(id: string, body: string, actor: Actor) {
    checkRole(actor);
    return prisma.$transaction(async tx => {
      const thread = await tx.supportThread.findFirst({ where: { id, ...(isSupervisor(actor) ? {} : { creatorId: actor.id }) }, select: { id: true } });
      if (!thread) throw notFound('Conversación no encontrada.');
      await tx.supportMessage.create({ data: { threadId: id, senderId: actor.id, body } });
      return tx.supportThread.update({ where: { id }, data: { updatedAt: new Date() }, include });
    });
  },
};
