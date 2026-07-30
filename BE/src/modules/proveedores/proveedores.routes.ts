import { Router } from 'express';
import { getProveedores, crearProveedor, editarProveedor, eliminarProveedor } from './proveedores.controller';

const router = Router();
router.get('/', getProveedores);
router.post('/', crearProveedor);
router.put('/:id', editarProveedor);
router.delete('/:id', eliminarProveedor);
export default router;