import { Router } from 'express';
import { createIncidentController } from '../controllers/incident.controller';
import { IncidentService } from '../services/incident.service';
import { requireAdmin } from '../middlewares/admin.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { validateId } from '../middlewares/validate-id.middleware';
import { validateIncident } from '../middlewares/validate-incident.middleware';
import { validatePriority } from '../middlewares/validate-priority.middleware';
import { validateStatus } from '../middlewares/validate-status.middleware';
import { validateTime } from '../middlewares/validate-time.middleware';

export function createIncidentRouter(service: IncidentService): Router {
  const router = Router();
  const controller = createIncidentController(service);

  // Las rutas fijas deben declararse antes de /:id.
  router.get('/critical', controller.getCritical);
  router.get('/pending', controller.getPending);
  router.get('/stats', controller.getStats);
  router.get('/', controller.getAll);
  router.get('/:id', validateId, controller.getById);

  router.post(
    '/',
    authenticate,
    validateIncident,
    validatePriority,
    validateTime,
    controller.create,
  );
  router.put(
    '/:id',
    authenticate,
    validateId,
    validateIncident,
    validatePriority,
    validateTime,
    controller.update,
  );
  router.patch(
    '/:id/status',
    authenticate,
    validateId,
    validateStatus,
    controller.updateStatus,
  );
  router.delete(
    '/:id',
    authenticate,
    validateId,
    requireAdmin,
    controller.remove,
  );

  return router;
}
