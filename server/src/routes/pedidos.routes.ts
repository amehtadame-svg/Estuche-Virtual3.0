import { Router } from 'express';
import { getPedidoById, aplicarDescuento, getPedidos, crearPedido, editarPedido, eliminarPedido } from '../controllers/pedidos.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();
router.get('/',    getPedidos); 
router.get('/:id', getPedidoById);
router.post('/', verifyToken, crearPedido);
router.put('/:id', editarPedido);
router.delete('/:id', eliminarPedido);
router.patch('/:id/aplicar-descuento', verifyToken, aplicarDescuento);

export default router;