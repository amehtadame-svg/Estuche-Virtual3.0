import { Router } from 'express';
import { verifyToken, verifyAdmin, verifySuperAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import {
  createUserSchema,
  editUserSchema,
  updateProfileSchema,
  updateRoleSchema,
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
} from './users.controller';

const router = Router();

// C-01 / RF-030: la gestión de usuarios nunca fue pública. Antes ninguna de
// estas rutas exigía token: cualquiera podía crear una cuenta superadmin o
// cambiar el rol de un usuario con una simple petición.
router.get('/',                   verifyToken, verifyAdmin, listUsers);
router.post('/',                  verifyToken, verifyAdmin, validate({ body: createUserSchema }), createUser);
router.put('/:id',                verifyToken, verifyAdmin, validate({ params: uuidParam, body: editUserSchema }), editUser);
router.patch('/:id/role',         verifyToken, verifySuperAdmin, validate({ params: uuidParam, body: updateRoleSchema }), updateRole);
router.get('/:id/preview-delete', verifyToken, verifySuperAdmin, validate({ params: uuidParam }), previewDeleteUser);
router.delete('/:id',             verifyToken, verifySuperAdmin, validate({ params: uuidParam }), deleteUser);

// Datos propios: el dueño de la cuenta (o un administrador).
router.patch('/:id/profile',      verifyToken, validate({ params: uuidParam, body: updateProfileSchema }), updateProfile);
router.get('/:id',                verifyToken, validate({ params: uuidParam }), getUser);

export default router;
