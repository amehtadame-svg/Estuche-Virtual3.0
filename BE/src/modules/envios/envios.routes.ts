import { Router } from 'express';
import { getEnvios, crearEnvio, editarEnvio, eliminarEnvio } from './envios.controller';

const router = Router();
router.get('/', getEnvios);
router.post('/', crearEnvio);
router.put('/:id', editarEnvio);
router.delete('/:id', eliminarEnvio);
export default router;