import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { newThreadSchema, replySchema } from './support.schema';
import { supportService } from './support.service';

const router = Router();
router.use(verifyToken, (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
router.get('/threads', asyncHandler(async (req, res) => res.json(await supportService.list((req as any).user))));
router.get('/threads/:id', validate({ params: uuidParam }), asyncHandler(async (req, res) => res.json(await supportService.get(req.params.id, (req as any).user))));
const writeLimit = rateLimit({ windowMs: 60000, limit: 20, standardHeaders: true, legacyHeaders: false });
router.post('/threads', writeLimit, validate({ body: newThreadSchema }), asyncHandler(async (req, res) => res.status(201).json(await supportService.create(req.body.subject, req.body.body, (req as any).user))));
router.post('/threads/:id/messages', writeLimit, validate({ params: uuidParam, body: replySchema }), asyncHandler(async (req, res) => res.status(201).json(await supportService.reply(req.params.id, req.body.body, (req as any).user))));
export default router;
