import { Router } from 'express';
import { getUsuarios, updateRol, crearUsuario, editarUsuario, eliminarUsuario } from '../controllers/usuarios.controller';

const router = Router();

router.get('/', getUsuarios);
router.post('/', crearUsuario);
router.patch('/:id/rol', updateRol);
router.put('/:id', editarUsuario);
router.delete('/:id', eliminarUsuario);

export default router;