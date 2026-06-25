import { Router } from 'express';
import { getPedidos, crearPedido, editarPedido, eliminarPedido } from '../controllers/pedidos.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', getPedidos);
router.post('/', verifyToken, crearPedido);
router.put('/:id', editarPedido);
router.delete('/:id', eliminarPedido);

export default router;