import { Router } from 'express';
import { z } from 'zod';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';
import { databaseUuidSchema, uuidProductParam } from '../../lib/schemas';
import { wishlistService } from './wishlist.service';

const router = Router();
router.use(verifyToken, (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  if ((req as any).user.role !== 'client') return res.status(403).json({ message: 'La lista de deseos está disponible solo para clientes.' });
  next();
});
router.get('/', asyncHandler(async (req, res) => res.json(await wishlistService.list((req as any).user.id))));
router.post('/', validate({ body: z.object({ productId: databaseUuidSchema }).strict() }), asyncHandler(async (req, res) => {
  res.status(201).json(await wishlistService.add((req as any).user.id, req.body.productId));
}));
router.delete('/:productId', validate({ params: uuidProductParam }), asyncHandler(async (req, res) => {
  await wishlistService.remove((req as any).user.id, req.params.productId);
  res.status(204).end();
}));
export default router;
