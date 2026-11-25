import { Router, Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { verifyToken } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../middlewares/asyncHandler';
import { validate } from '../../middlewares/validate';
import { uuidParam } from '../../lib/schemas';
import { badRequest } from '../../lib/errors';
import {
  Actor,
  assertStaff,
} from './employee.domain';
import { employeeService as service } from './employee.service';
import { payoutService } from '../payout/payout.service';
import * as schema from './employee.schema';

const router = Router();

const actor = (req: Request) =>
  (req as any).user as Actor;

const empty = {
  parse: (data: unknown) => {
    if (
      data &&
      Object.keys(data as object).length
    ) {
      throw badRequest(
        'Esta operación no acepta campos.'
      );
    }
  },
};

router.use(verifyToken);

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

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

router.use((req, _res, next) => {
  try {
    assertStaff(actor(req));
    next();
  } catch (error) {
    next(error);
  }
});

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    res.json(
      await service.summary(actor(req))
    );
  })
);

for (
  const resource of [
    'customers',
    'products',
  ] as const
) {
  router.get(
    `/${resource}`,
    asyncHandler(async (req, res) => {
      const query =
        schema.searchSchema.safeParse(
          req.query
        );

      if (!query.success) {
        throw badRequest(
          'Busca al menos dos caracteres e indica una página válida.'
        );
      }

      res.json(
        await service[resource](
          actor(req),
          query.data.q,
          query.data.page
        )
      );
    })
  );
}

router.get(
  '/drivers',
  asyncHandler(async (req, res) => {
    res.json(
      await service.people(
        actor(req),
        'delivery'
      )
    );
  })
);

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

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const query =
      schema.pageSchema.safeParse(req.query);

    if (!query.success) {
      throw badRequest('Consulta inválida.');
    }

    res.json(
      await service.list(
        actor(req),
        query.data.scope,
        query.data.page
      )
    );
  })
);

router.post(
  '/orders',
  validate({
    body: schema.newEmployeeOrder,
  }),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await service.create(
        req.body,
        actor(req)
      )
    );
  })
);

router.get(
  '/orders/:id',
  validate({
    params: uuidParam,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.detail(
        req.params.id,
        actor(req)
      )
    );
  })
);

router.post(
  '/orders/:id/claim',
  validate({
    params: uuidParam,
  }),
  asyncHandler(async (req, res) => {
    empty.parse(req.body);

    res.json(
      await service.claim(
        req.params.id,
        actor(req)
      )
    );
  })
);

router.patch(
  '/orders/:id/picking',
  validate({
    params: uuidParam,
    body: schema.pickingSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.picking(
        req.params.id,
        req.body.items,
        actor(req)
      )
    );
  })
);

router.post(
  '/orders/:id/pack',
  validate({
    params: uuidParam,
  }),
  asyncHandler(async (req, res) => {
    empty.parse(req.body);

    res.json(
      await service.pack(
        req.params.id,
        actor(req)
      )
    );
  })
);

router.post(
  '/orders/:id/incident',
  validate({
    params: uuidParam,
    body: schema.noteSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.incident(
        req.params.id,
        req.body.note,
        actor(req)
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
      await service.resolve(
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
      await service.reassign(
        req.params.id,
        req.body.assigneeId,
        req.body.note,
        actor(req)
      )
    );
  })
);

router.post(
  '/orders/:id/dispatch',
  validate({
    params: uuidParam,
    body: schema.dispatchSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.dispatch(
        req.params.id,
        req.body.driverId,
        actor(req)
      )
    );
  })
);

router.post(
  '/orders/:id/pickup',
  rateLimit({
    windowMs: 60000,
    limit: 20,
  }),
  validate({
    params: uuidParam,
    body: schema.pickupSchema,
  }),
  asyncHandler(async (req, res) => {
    res.json(
      await service.pickup(
        req.params.id,
        req.body.code,
        req.body.recipientName,
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
      await service.cancel(
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

router.post(
  '/inventory',
  validate({
    body: schema.inventorySchema,
  }),
  asyncHandler(async (req, res) => {
    res.status(201).json(
      await service.inventory(
        req.body,
        actor(req)
      )
    );
  })
);

for (
  const resource of [
    'movements',
    'activity',
  ] as const
) {
  router.get(
    `/${resource}`,
    asyncHandler(async (req, res) => {
      const query =
        schema.pageSchema.safeParse(
          req.query
        );

      if (!query.success) {
        throw badRequest(
          'Página inválida.'
        );
      }

      res.json(
        await service[resource](
          actor(req),
          query.data.page
        )
      );
    })
  );
}

export default router;