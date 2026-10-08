import express, { type Express } from 'express';
import { IncidentStore, incidentStore } from './data/incidents.data';
import { IncidentService } from './services/incident.service';
import { createIncidentRouter } from './routes/incident.routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { loggerMiddleware } from './middlewares/logger.middleware';
import { notFoundMiddleware } from './middlewares/not-found.middleware';
import { requestInfoMiddleware } from './middlewares/request-info.middleware';

/** Construye la aplicación; el almacén puede inyectarse para aislar las pruebas. */
export function createApp(store: IncidentStore = incidentStore): Express {
  const app = express();
  const incidentService = new IncidentService(store);

  app.disable('x-powered-by');
  app.use(loggerMiddleware);
  app.use(requestInfoMiddleware);
  app.use(express.json({ limit: '100kb' }));
  app.use('/api/incidents', createIncidentRouter(incidentService));
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
