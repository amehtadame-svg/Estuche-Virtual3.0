import { Router } from 'express';
import { getDetallePedidos, crearDetalle, editarDetalle, eliminarDetalle } from '../controllers/detallepedido.controller';

const router = Router();
router.get('/', getDetallePedidos);
router.post('/', crearDetalle);
router.put('/:id', editarDetalle);
router.delete('/:id', eliminarDetalle);
export default router;