import { Router, Request } from 'express';
import { verifyToken, verifyAdmin } from '../../middlewares/auth.middleware';
import { payoutService } from '../payout/payout.service';
import * as schema from '../employee/employee.schema';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { badRequest } from '../../lib/errors';
import { Actor } from '../employee/employee.domain';
import { supervisionService } from './supervision.service';
import { employeeService as service } from '../employee/employee.service';
const router = Router();
const actor = (req: Request) => (req as any).user as Actor;
router.use(verifyToken);
router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
router.use(verifyAdmin);
router.get(
  '/employees',
  asyncHandler(async (req, res) => {
    res.json(
      await service.people(
        actor(req),
        'employee'
      )
    );
  })
);

router.post(
  '/orders/:id/resolve',
  validate({
    params: uuidParam,
    body: schema.noteSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await supervisionService.resolve(
        req.params.id,
        req.body.note,
        actor(req)
      )
    );
  })
);

router.post(
  '/orders/:id/reassign',
  validate({
    params: uuidParam,
    body: schema.reassignSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await supervisionService.reassign(
        req.params.id,
        req.body.assigneeId,
        req.body.note,
        actor(req)
      )
    );
  })
);

router.post(
  '/orders/:id/cancel',
  validate({
    params: uuidParam,
    body: schema.noteSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await supervisionService.cancel(
        req.params.id,
        req.body.note,
        actor(req)
      )
    );
  })
);

router.post(
  '/orders/:id/simulate-payment',
  validate({
    params: uuidParam,
    body: schema.simulationSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await payoutService.simulate(
        req.params.id,
        req.body.requestKey,
        req.body.result,
        actor(req)
      )
    );
  })
);
router.get('/orders', asyncHandler(async (req, res) => {
  const query = schema.pageSchema.safeParse(req.query);
  if (!query.success || (req.query.scope && query.data.scope !== 'supervision')) throw badRequest('Consulta inválida.');
  res.json(await service.list(actor(req), 'supervision', query.data.page));
}));
for (const resource of ['movements', 'activity'] as const) {
  router.get(`/${resource}`, asyncHandler(async (req, res) => {
    const query = schema.pageSchema.safeParse(req.query);
    if (!query.success) throw badRequest('Página inválida.');
    res.json(await service[resource](actor(req), query.data.page, true));
  }));
}
export default router;
