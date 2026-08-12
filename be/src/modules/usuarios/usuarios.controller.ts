import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';


export const getUsuarios = async (_req: Request, res: Response) => {
  try {
    const usuarios = await prisma.usuarios.findMany({
      select: { id_usuario: true, nombre: true, email: true, rol: true },
    });
    return res.json(usuarios);
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener usuarios.' });
  }
};

export const getUsuarioById = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const solicitante = (req as any).user;
  const esDueño = solicitante?.id === id;
  const esAdmin = ['administrador', 'superadmin'].includes(solicitante?.role);

  if (!esDueño && !esAdmin) {
    return res.status(403).json({ message: 'No puedes ver este perfil.' });
  }

  const usuario = await prisma.usuarios.findUnique({
    where: { id_usuario: id },
    select: {
      id_usuario: true,
      nombre: true,
      email: true,
      rol: true,
      telefono: true,
      direccion: true,
    },
  });
  if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
  return res.json(usuario);
};

export const actualizarPerfil = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { telefono, direccion } = req.body;
  const solicitante = (req as any).user;
  const esDueño = solicitante?.id === id;
  const esAdmin = ['administrador', 'superadmin'].includes(solicitante?.role);
  if (!esDueño && !esAdmin) {
    return res.status(403).json({ message: 'No puedes modificar este perfil.' });
  }

  const usuario = await prisma.usuarios.update({
    where: { id_usuario: id },
    data: { telefono, direccion },
  });
  return res.json(usuario);
};

export const updateRol = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rol } = req.body;
  const rolSolicitante = (req as any).user?.role;

  const rolesValidos = ['superadmin', 'administrador', 'empleado', 'repartidor', 'cliente'];
  if (!rolesValidos.includes(rol))
    return res.status(400).json({ message: 'Rol inválido' });

  // Un administrador normal no puede otorgar (ni tocar) roles de superadmin/administrador
  if (rolSolicitante === 'administrador' &&
     (rol === 'superadmin' || rol === 'administrador')) {
    return res.status(403).json({ message: 'No puedes asignar ese rol.' });
  }

  const usuario = await prisma.usuarios.update({
    where: { id_usuario: Number(id) },
    data: { rol },
  });
  return res.json(usuario);
};

export const crearUsuario = async (req: Request, res: Response) => {
  const { nombre, email, password, rol } = req.body;
  const rolSolicitante = (req as any).user?.role;

  // Admin no puede crear superadmin ni administrador
  if (rolSolicitante === 'administrador' &&
     (rol === 'superadmin' || rol === 'administrador')) {
    return res.status(403).json({ message: 'No puedes crear usuarios con ese rol.' });
  }

  const existe = await prisma.usuarios.findUnique({ where: { email } });
  if (existe) return res.status(400).json({ message: 'El correo ya está registrado' });

  const hashed = await bcrypt.hash(password, 10);
  const usuario = await prisma.usuarios.create({
    data: { nombre, email, password: hashed, rol: rol || 'cliente' },
  });
  return res.status(201).json(usuario);
};

export const editarUsuario = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nombre, email, rol } = req.body;
  const rolSolicitante = (req as any).user?.role;

  // Misma regla anti-escalamiento que crearUsuario/updateRol
  if (rol !== undefined && rolSolicitante === 'administrador' &&
     (rol === 'superadmin' || rol === 'administrador')) {
    return res.status(403).json({ message: 'No puedes asignar ese rol.' });
  }

  const usuario = await prisma.usuarios.update({
    where: { id_usuario: Number(id) },
    data: { nombre, email, rol },
  });
  return res.json(usuario);
};

export const previewEliminarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const rolSolicitante = (req as any).user?.role;

  if (rolSolicitante !== 'superadmin') {
    return res.status(403).json({ message: 'No tienes permisos.' });
  }

  const pedidosComoCliente = await prisma.pedidos.findMany({
    where:  { id_cliente: id },
    select: { id_pedido: true },
  });
  const idsPedidos = pedidosComoCliente.map(p => p.id_pedido);

  const pedidosComoRepartidor = await prisma.pedidos.count({ where: { id_repartidor: id } });

  const detalles = idsPedidos.length
    ? await prisma.detalle_pedido.count({ where: { id_pedido: { in: idsPedidos } } })
    : 0;

  const enviosDePedidos = idsPedidos.length
    ? await prisma.envios.count({ where: { id_pedido: { in: idsPedidos } } })
    : 0;

  return res.json({
    pedidos_como_cliente:     idsPedidos.length,
    detalle_pedido:           detalles,
    envios_de_esos_pedidos:   enviosDePedidos,
    pedidos_como_repartidor:  pedidosComoRepartidor,
  });
};

export const eliminarUsuario = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const rolSolicitante = (req as any).user?.role;

  // Solo superadmin puede eliminar
  if (rolSolicitante !== 'superadmin') {
    return res.status(403).json({ message: 'No tienes permisos para eliminar usuarios.' });
  }

  const pedidosComoCliente = await prisma.pedidos.findMany({
    where:  { id_cliente: id },
    select: { id_pedido: true },
  });
  const idsPedidos = pedidosComoCliente.map(p => p.id_pedido);

  await prisma.$transaction(async (tx) => {
    if (idsPedidos.length) {
      await tx.detalle_pedido.deleteMany({ where: { id_pedido: { in: idsPedidos } } });
      await tx.envios.deleteMany({ where: { id_pedido: { in: idsPedidos } } });
      await tx.facturas.deleteMany({ where: { id_pedido: { in: idsPedidos } } });
      await tx.pedidos.deleteMany({ where: { id_pedido: { in: idsPedidos } } });
    }

    await tx.pedidos.updateMany({
      where: { id_repartidor: id },
      data:  { id_repartidor: null },
    });

    await tx.usuarios.delete({ where: { id_usuario: id } });
  });

  return res.status(204).send();
};