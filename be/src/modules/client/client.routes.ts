import { Router, Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { badRequest } from '../../lib/errors';
import { Actor } from '../employee/employee.domain';
import { clientService as service } from './client.service';
const router = Router();
const actor = (req: Request) => (req as any).user as Actor;
router.use(verifyToken);
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
const empty = { parse: (data: unknown) => { if (data && Object.keys(data as object).length) throw badRequest('Esta operación no acepta campos.'); } };
router.get(
  '/my-pickups',
  asyncHandler(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');

    res.json(
      await service.customerPickups(actor(req))
    );
  })
);

router.post(
  '/orders/:id/pickup-code',
  rateLimit({
    windowMs: 60000,
    limit: 10,
  }),
  validate({
    params: uuidParam,
  }),
  asyncHandler(async (req, res) => {
    empty.parse(req.body);
    res.setHeader('Cache-Control', 'no-store');

    res.json(
      await service.issuePickupCode(
        req.params.id,
        actor(req)
      )
    );
  })
);


export default router;
