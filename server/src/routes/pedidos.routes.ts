import { Router } from 'express';
import { getPedidos, crearPedido, editarPedido, eliminarPedido } from '../controllers/pedidos.controller';

const router = Router();

router.get('/', getPedidos);
router.post('/', crearPedido);
router.put('/:id', editarPedido);
router.delete('/:id', eliminarPedido);

export default router;