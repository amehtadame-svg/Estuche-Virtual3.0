import type { RequestHandler } from 'express';
import type {
  CreateIncidentDto,
  UpdateIncidentDto,
} from '../dtos/incident.dto';
import { AppError } from '../errors/app-error';
import type { IncidentStatus } from '../models/incident.model';
import { IncidentService } from '../services/incident.service';

export function createIncidentController(service: IncidentService) {
  const getAll: RequestHandler = (_req, res) => {
    const data = service.getAll();
    res.status(200).json({ ok: true, total: data.length, data });
  };

  const getById: RequestHandler = (req, res) => {
    const data = service.getById(Number(req.params.id));
    res.status(200).json({ ok: true, data });
  };

  const create: RequestHandler = (req, res) => {
    const validated = req.validatedIncident;
    if (!validated || typeof validated.reporter !== 'string') {
      throw new AppError(500, 'Validated create DTO is missing');
    }

    const dto: CreateIncidentDto = {
      title: validated.title,
      description: validated.description,
      reporter: validated.reporter,
      location: validated.location,
      priority: validated.priority,
      estimatedMinutes: validated.estimatedMinutes,
    };
    const data = service.create(dto);
    res.status(201).json({ ok: true, data });
  };

  const update: RequestHandler = (req, res) => {
    const validated = req.validatedIncident;
    if (!validated) {
      throw new AppError(500, 'Validated update DTO is missing');
    }

    const dto: UpdateIncidentDto = {
      title: validated.title,
      description: validated.description,
      ...(typeof validated.reporter === 'string'
        ? { reporter: validated.reporter }
        : {}),
      location: validated.location,
      priority: validated.priority,
      estimatedMinutes: validated.estimatedMinutes,
    };
    const data = service.update(Number(req.params.id), dto);
    res.status(200).json({ ok: true, data });
  };

  const updateStatus: RequestHandler = (req, res) => {
    const validated = req.validatedStatus;
    if (!validated) {
      throw new AppError(500, 'Validated status DTO is missing');
    }

    const data = service.updateStatus(
      Number(req.params.id),
      validated.status as IncidentStatus,
    );
    res.status(200).json({ ok: true, data });
  };

  const remove: RequestHandler = (req, res) => {
    service.delete(Number(req.params.id));
    res.status(204).end();
  };

  const getCritical: RequestHandler = (_req, res) => {
    const data = service.getCritical();
    res.status(200).json({ ok: true, total: data.length, data });
  };

  const getPending: RequestHandler = (_req, res) => {
    const data = service.getPending();
    res.status(200).json({ ok: true, total: data.length, data });
  };

  const getStats: RequestHandler = (_req, res) => {
    res.status(200).json({ ok: true, data: service.getStats() });
  };

  return {
    getAll,
    getById,
    create,
    update,
    updateStatus,
    remove,
    getCritical,
    getPending,
    getStats,
  };
}
