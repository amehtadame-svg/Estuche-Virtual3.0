import { Router } from 'express';
import { verifyToken, verifyAdmin, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import {
  createUserSchema,
  editUserSchema,
  updateProfileSchema,
  updateRoleSchema,
  setActiveSchema,
} from './users.schema';
import {
  listUsers,
  getUser,
  updateProfile,
  updateRole,
  createUser,
  editUser,
  previewDeleteUser,
  deleteUser,
  setUserActive,
} from './users.controller';

const router = Router();

// HU-018 · Control de usuarios y permisos.
// Todas las rutas exigen sesión. Además, el service valida el rol
// (isAdmin / isSuperAdmin / canAssignRole) para no depender solo del middleware.

// ── Lectura y gestión básica: admin y superadmin ──────────────────────────
router.get('/', verifyToken, verifyAdmin, listUsers);
router.post('/', verifyToken, verifyAdmin, validate({ body: createUserSchema }), createUser);
router.put(
  '/:id',
  verifyToken,
  verifyAdmin,
  validate({ params: uuidParam, body: editUserSchema }),
  editUser
);
router.patch(
  '/:id/role',
  verifyToken,
  verifyAdmin,
  validate({ params: uuidParam, body: updateRoleSchema }),
  updateRole
);

// ── Activar / desactivar cuenta: admin y superadmin ───────────────────────
// No borra nada. El service impide que un admin toque a otro administrador
// y que nadie se desactive a sí mismo.
router.patch(
  '/:id/status',
  verifyToken,
  verifyAdmin,
  validate({ params: uuidParam, body: setActiveSchema }),
  setUserActive
);

// ── Vista previa e "eliminación": solo superadmin ─────────────────────────
// DELETE ya NO borra: desactiva la cuenta (se conserva por compatibilidad).
router.get(
  '/:id/preview-delete',
  verifyToken,
  verifySuperAdmin,
  validate({ params: uuidParam }),
  previewDeleteUser
);
router.delete('/:id', verifyToken, verifySuperAdmin, validate({ params: uuidParam }), deleteUser);

// ── Perfil propio: el service valida dueño o administrador ───────────────
router.patch(
  '/:id/profile',
  verifyToken,
  validate({ params: uuidParam, body: updateProfileSchema }),
  updateProfile
);
router.get('/:id', verifyToken, validate({ params: uuidParam }), getUser);

export default router;