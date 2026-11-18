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

// Campos públicos: nunca devolver hashedPassword al cliente.
const publicFields = { id: true, fullName: true, email: true, role: true, isActive: true } as const;
const profileFields = { ...publicFields, phone: true, address: true } as const;

export const userService = {
  list() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: { ...publicFields },
      orderBy: { fullName: 'asc' },
    });
  },

  async getById(id: string, requester: Requester | undefined) {
    if (!isOwner(requester, id) && !isAdmin(requester)) throw forbidden('No puedes ver este perfil.');

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { ...profileFields },
    });

    if (!user) throw notFound('Usuario no encontrado');
    return user;
  },

  async updateProfile(
    id: string,
    data: { phone?: string; address?: string },
    requester: Requester | undefined
  ) {
    if (!isOwner(requester, id) && !isAdmin(requester)) throw forbidden('No puedes modificar este perfil.');

    return prisma.user.update({
      where: { id },
      data,
      select: { ...profileFields },
    });
  },

  async updateRole(id: string, role: string, requester: Requester | undefined) {
    if (!canAssignRole(requester, role)) throw forbidden('No puedes asignar ese rol.');

    return prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { ...publicFields },
    });
  },

  async create(
    data: { fullName: string; email: string; password: string; role?: string },
    requester: Requester | undefined
  ) {
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
      select: { ...publicFields },
    });
  },

  async edit(
    id: string,
    data: { fullName?: string; email?: string; role?: string },
    requester: Requester | undefined
  ) {
    if (data.role !== undefined && !canAssignRole(requester, data.role)) {
      throw forbidden('No puedes asignar ese rol.');
    }

    const { role, ...rest } = data;

    return prisma.user.update({
      where: { id },
      data: { ...rest, role: role as any },
      select: { ...publicFields },
    });
  },

  /**
   * Vista previa del impacto de desactivar una cuenta.
   * No borra nada: solo informa cuánto historial se conserva.
   */
  async previewDelete(id: string, requester: Requester | undefined) {
    if (!isSuperAdmin(requester)) throw forbidden('No tienes permisos.');

    const ordersAsCustomer = await prisma.order.findMany({
      where: { customerId: id },
      select: { id: true },
    });
    const orderIds = ordersAsCustomer.map((o) => o.id);

    const [details, despatches, ordersAsDriver] = await Promise.all([
      orderIds.length
        ? prisma.orderDetail.count({ where: { orderId: { in: orderIds } } })
        : Promise.resolve(0),
      orderIds.length
        ? prisma.despatch.count({ where: { orderId: { in: orderIds } } })
        : Promise.resolve(0),
      prisma.order.count({ where: { driverId: id } }),
    ]);

    return {
      action: 'deactivate', // no se borra nada: solo se inactiva la cuenta
      orders_as_customer: orderIds.length,
      order_details: details,
      shipments_of_those_orders: despatches,
      orders_as_driver: ordersAsDriver,
    };
  },

  /**
   * HU-018 · Activa o desactiva una cuenta SIN borrar nada.
   *
   * El historial (pedidos, recibos, movimientos de inventario, reportes) se
   * conserva intacto: el usuario simplemente deja de poder iniciar sesión,
   * porque `auth.login` y `verifyToken` rechazan las cuentas con isActive=false.
   *
   * Reglas:
   *  - Solo admin o superadmin.
   *  - Nadie puede desactivarse a sí mismo.
   *  - Un admin no puede desactivar a otro admin/superadmin.
   */
  async setActive(id: string, isActive: boolean, requester: Requester | undefined) {
    if (!isAdmin(requester)) {
      throw forbidden('No tienes permisos para activar o desactivar usuarios.');
    }
    if (requester?.id === id) {
      throw badRequest('No puedes desactivar tu propia cuenta.');
    }

    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!user) throw notFound('Usuario no encontrado.');

    const targetIsAdmin = ADMIN_ROLES.includes(user.role);
    if (targetIsAdmin && !isSuperAdmin(requester)) {
      throw forbidden('Solo un superadmin puede activar o desactivar a otro administrador.');
    }

    return prisma.user.update({
      where: { id },
      data: {
        isActive,
        // Se limpia cualquier bloqueo pendiente; al reactivar se reinicia el contador.
        lockedUntil: null,
        ...(isActive ? { failedAttempts: 0 } : {}),
      },
      select: { ...publicFields },
    });
  },

  /**
   * Se conserva el endpoint DELETE por compatibilidad, pero ya no destruye nada:
   * delega en setActive(id, false).
   */
  async remove(id: string, requester: Requester | undefined) {
    return userService.setActive(id, false, requester);
  },
};