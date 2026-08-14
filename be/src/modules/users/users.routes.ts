import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
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

// NOTA: se conserva el auth tal cual estaba originalmente (solo profile y getById
// requerían token). Recomendación de seguridad: proteger también las rutas de
// gestión (create/edit/role/delete) con verifyToken + verificación de rol.
router.get('/',                   listUsers);
router.post('/',                  validate({ body: createUserSchema }), createUser);
router.patch('/:id/role',         validate({ params: uuidParam, body: updateRoleSchema }), updateRole);
router.put('/:id',                validate({ params: uuidParam, body: editUserSchema }), editUser);
router.get('/:id/preview-delete', validate({ params: uuidParam }), previewDeleteUser);
router.delete('/:id',             validate({ params: uuidParam }), deleteUser);
router.patch('/:id/profile',      verifyToken, validate({ params: uuidParam, body: updateProfileSchema }), updateProfile);
router.get('/:id',                verifyToken, validate({ params: uuidParam }), getUser);

export default router;
