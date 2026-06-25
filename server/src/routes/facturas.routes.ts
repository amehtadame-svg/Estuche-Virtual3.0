import { Router } from 'express';
import { getFacturas, crearFactura, editarFactura, eliminarFactura } from '../controllers/facturas.controller';

const router = Router();
router.get('/', getFacturas);
router.post('/', crearFactura);
router.put('/:id', editarFactura);
router.delete('/:id', eliminarFactura);
export default router;