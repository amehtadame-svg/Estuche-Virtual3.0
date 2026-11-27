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
import * as schema from './employee.schema';
import { registerStorePayment } from './store-payment.service';

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
  '/orders',
  asyncHandler(async (req, res) => {
    const query =
      schema.pageSchema.safeParse(req.query);

    if (!query.success) {
      throw badRequest('Consulta inválida.');
    }

    if (query.data.scope === 'supervision') throw badRequest('Usa el módulo de supervisión.');

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

router.post('/orders/:id/store-payment', validate({ params: uuidParam, body: schema.storePaymentSchema }), asyncHandler(async (req, res) => {
  res.json(await registerStorePayment(req.params.id, req.body.requestKey, req.body.method, actor(req)));
}));

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