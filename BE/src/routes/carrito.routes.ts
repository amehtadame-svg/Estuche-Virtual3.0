import { Router } from 'express';
import {
  getCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  quitarDelCarrito,
  vaciarCarrito,
} from '../controllers/carrito.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken); // todas las rutas de carrito requieren login

router.get('/',                    getCarrito);
router.post('/',                   agregarAlCarrito);
router.put('/:id_producto',        actualizarCantidad);
router.delete('/vaciar',           vaciarCarrito);
router.delete('/:id_producto',     quitarDelCarrito);

export default router;