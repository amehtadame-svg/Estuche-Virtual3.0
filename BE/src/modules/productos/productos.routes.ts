import { Router } from 'express';
import { getProductos, crearProducto, editarProducto, eliminarProducto } from './productos.controller';

const router = Router();
router.get('/', getProductos);
router.post('/', crearProducto);
router.put('/:id', editarProducto);
router.delete('/:id', eliminarProducto);
export default router;