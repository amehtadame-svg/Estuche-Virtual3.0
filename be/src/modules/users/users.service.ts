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
    // C-05: los usuarios con borrado lógico no aparecen en el listado.
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, fullName: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
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

    // Se ignoran las cuentas con borrado lógico para que el correo pueda
    // volver a usarse, pero sin duplicar el registro histórico.
    const exists = await prisma.user.findFirst({ where: { email: data.email, deletedAt: null } });
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

  /**
   * Borrado lógico (C-05 / Ley 1581).
   *
   * Antes se hacía un borrado físico en cascada que destruía los pedidos,
   * detalles, envíos y recibos del cliente: al borrar una cuenta se perdía
   * todo el historial de ventas. Ahora solo se marca `deletedAt` y se
   * desactiva la cuenta; los pedidos y su contabilidad se conservan.
   */
  async remove(id: string, requester: Requester | undefined) {
    if (!isSuperAdmin(requester)) throw forbidden('No tienes permisos para eliminar usuarios.');

    const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) throw notFound('Usuario no encontrado.');

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        // Se anonimiza el correo para liberarlo y poder reutilizarlo sin
        // perder el registro histórico del usuario.
        email: `borrado+${id}@estuche.local`,
      },
    });

    return null;
  },
};