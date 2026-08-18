import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { badRequest, forbidden, notFound } from '../../lib/errors';

interface Requester {
  id: string;
  role: string;
}

const ADMIN_ROLES = ['admin', 'superadmin'];

const isOwner = (r: Requester | undefined, id: string) => !!r && r.id === id;
const isAdmin = (r: Requester | undefined) => !!r && ADMIN_ROLES.includes(r.role);
const isSuperAdmin = (r: Requester | undefined) => !!r && r.role === 'superadmin';
const canAssignRole = (r: Requester | undefined, role?: string) =>
  !(r?.role === 'admin' && (role === 'superadmin' || role === 'admin'));

export const userService = {
  list() {
    return prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true },
    });
  },

  async getById(id: string, requester: Requester | undefined) {
    if (!isOwner(requester, id) && !isAdmin(requester)) throw forbidden('No puedes ver este perfil.');
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, email: true, role: true, phone: true, address: true },
    });
    if (!user) throw notFound('Usuario no encontrado');
    return user;
  },

  async updateProfile(id: string, data: { phone?: string; address?: string }, requester: Requester | undefined) {
    if (!isOwner(requester, id) && !isAdmin(requester)) throw forbidden('No puedes modificar este perfil.');
    return prisma.user.update({ where: { id }, data });
  },

  async updateRole(id: string, role: string, requester: Requester | undefined) {
    if (!canAssignRole(requester, role)) throw forbidden('No puedes asignar ese rol.');
    return prisma.user.update({ where: { id }, data: { role: role as any } });
  },

  async create(data: { fullName: string; email: string; password: string; role?: string }, requester: Requester | undefined) {
    if (!canAssignRole(requester, data.role)) throw forbidden('No puedes crear usuarios con ese rol.');

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw badRequest('El correo ya está registrado');

    const hashed = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        hashedPassword: hashed,
        role: (data.role || 'client') as any,
        passwordUpdatedAt: new Date(),
        dataConsentAt: new Date(),
      },
    });
  },

  async edit(id: string, data: { fullName?: string; email?: string; role?: string }, requester: Requester | undefined) {
    if (data.role !== undefined && !canAssignRole(requester, data.role)) throw forbidden('No puedes asignar ese rol.');
    const { role, ...rest } = data;
    return prisma.user.update({ where: { id }, data: { ...rest, role: role as any } });
  },

  async previewDelete(id: string, requester: Requester | undefined) {
    if (!isSuperAdmin(requester)) throw forbidden('No tienes permisos.');

    const ordersAsCustomer = await prisma.order.findMany({
      where: { customerId: id },
      select: { id: true },
    });
    const orderIds = ordersAsCustomer.map((o) => o.id);

    const [details, despatches, ordersAsDriver] = await Promise.all([
      orderIds.length ? prisma.orderDetail.count({ where: { orderId: { in: orderIds } } }) : Promise.resolve(0),
      orderIds.length ? prisma.despatch.count({ where: { orderId: { in: orderIds } } }) : Promise.resolve(0),
      prisma.order.count({ where: { driverId: id } }),
    ]);

    return {
      orders_as_customer: orderIds.length,
      order_details: details,
      shipments_of_those_orders: despatches,
      orders_as_driver: ordersAsDriver,
    };
  },

  async remove(id: string, requester: Requester | undefined) {
    if (!isSuperAdmin(requester)) throw forbidden('No tienes permisos para eliminar usuarios.');

    const ordersAsCustomer = await prisma.order.findMany({
      where: { customerId: id },
      select: { id: true },
    });
    const orderIds = ordersAsCustomer.map((o) => o.id);

    await prisma.$transaction(async (tx) => {
      if (orderIds.length) {
        await tx.orderDetail.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.despatch.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.receipt.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      await tx.order.updateMany({ where: { driverId: id }, data: { driverId: null } });
      // NOTE: cascading hard-delete is kept from the original flow.
      // `deletedAt` is available for implementing soft-delete in the future.
      await tx.user.delete({ where: { id } });
    });

    return null;
  },
};