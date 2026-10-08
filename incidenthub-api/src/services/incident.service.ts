import type {
  CreateIncidentDto,
  UpdateIncidentDto,
} from '../dtos/incident.dto';
import { AppError } from '../errors/app-error';
import type { Incident, IncidentStatus } from '../models/incident.model';
import { IncidentStore } from '../data/incidents.data';

const ALLOWED_TRANSITIONS: Readonly<
  Record<IncidentStatus, readonly IncidentStatus[]>
> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: [],
};

export interface IncidentStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
  averageEstimatedMinutes: number;
}

/** Contiene las reglas de negocio entre los controladores y el almacén. */
export class IncidentService {
  constructor(private readonly store: IncidentStore) {}

  getAll(): Incident[] {
    return this.store.getAll();
  }

  getById(id: number): Incident {
    const incident = this.store.findById(id);

    if (!incident) {
      throw new AppError(404, 'Incident not found');
    }

    return incident;
  }

  create(dto: CreateIncidentDto): Incident {
    return this.store.create(dto);
  }

  update(id: number, dto: UpdateIncidentDto): Incident {
    const incident = this.store.update(id, dto);

    if (!incident) {
      throw new AppError(404, 'Incident not found');
    }

    return incident;
  }

  updateStatus(id: number, nextStatus: IncidentStatus): Incident {
    const current = this.getById(id);

    // Repetir el mismo estado es una operación idempotente, no una transición.
    if (current.status === nextStatus) {
      return current;
    }

    const allowed = ALLOWED_TRANSITIONS[current.status];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(
        400,
        `Invalid status transition from ${current.status} to ${nextStatus}`,
      );
    }

    const updated = this.store.updateStatus(id, nextStatus);
    if (!updated) {
      throw new AppError(404, 'Incident not found');
    }

    return updated;
  }

  delete(id: number): void {
    if (!this.store.delete(id)) {
      throw new AppError(404, 'Incident not found');
    }
  }

  getCritical(): Incident[] {
    return this.store
      .getAll()
      .filter((incident) => incident.priority === 'CRITICAL');
  }

  getPending(): Incident[] {
    return this.store
      .getAll()
      .filter((incident) => incident.status !== 'RESOLVED');
  }

  getStats(): IncidentStats {
    const incidents = this.store.getAll();
    const totalEstimatedMinutes = incidents.reduce(
      (total, incident) => total + incident.estimatedMinutes,
      0,
    );

    return {
      total: incidents.length,
      open: incidents.filter((incident) => incident.status === 'OPEN').length,
      inProgress: incidents.filter(
        (incident) => incident.status === 'IN_PROGRESS',
      ).length,
      resolved: incidents.filter((incident) => incident.status === 'RESOLVED')
        .length,
      critical: incidents.filter(
        (incident) => incident.priority === 'CRITICAL',
      ).length,
      averageEstimatedMinutes:
        incidents.length === 0
          ? 0
          : Math.round(totalEstimatedMinutes / incidents.length),
    };
  }
}
