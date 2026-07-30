import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { getUsuarios, getUsuarioById, actualizarPerfil, updateRol, crearUsuario, editarUsuario, eliminarUsuario, previewEliminarUsuario } from './usuarios.controller';

const router = Router();

router.get('/', getUsuarios);
router.post('/', crearUsuario);
router.patch('/:id/rol', updateRol);
router.put('/:id', editarUsuario);
router.get('/:id/preview-delete', previewEliminarUsuario);
router.delete('/:id', eliminarUsuario);
router.patch('/:id/perfil',verifyToken, actualizarPerfil);
router.get('/:id', verifyToken, getUsuarioById);

export default router;