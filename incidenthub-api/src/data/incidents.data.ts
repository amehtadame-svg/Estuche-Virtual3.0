import type {
  CreateIncidentDto,
  UpdateIncidentDto,
} from '../dtos/incident.dto';
import type { Incident } from '../models/incident.model';

const SEED_INCIDENTS: Incident[] = [
  {
    id: 1,
    title: 'Proyector sin señal',
    description: 'El proyector no reconoce ningún computador conectado.',
    reporter: 'Carlos Díaz',
    location: 'Aula 201',
    priority: 'MEDIUM',
    status: 'OPEN',
    estimatedMinutes: 30,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
  {
    id: 2,
    title: 'Equipo sin acceso a Internet',
    description: 'El computador del laboratorio perdió la conexión de red.',
    reporter: 'Laura Gómez',
    location: 'Laboratorio 304',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    estimatedMinutes: 45,
    createdAt: new Date(Date.now() - 64_800_000).toISOString(),
  },
  {
    id: 3,
    title: 'Aplicación de nómina no inicia',
    description: 'La aplicación se cierra inmediatamente después de abrirla.',
    reporter: 'Andrés Rojas',
    location: 'Oficina 402',
    priority: 'CRITICAL',
    status: 'OPEN',
    estimatedMinutes: 60,
    createdAt: new Date(Date.now() - 43_200_000).toISOString(),
  },
  {
    id: 4,
    title: 'Impresora con atasco de papel',
    description: 'La impresora del área administrativa no completa los trabajos.',
    reporter: 'Sofía Martínez',
    location: 'Administración',
    priority: 'LOW',
    status: 'RESOLVED',
    estimatedMinutes: 25,
    createdAt: new Date(Date.now() - 21_600_000).toISOString(),
  },
  {
    id: 5,
    title: 'Computador se reinicia inesperadamente',
    description: 'El equipo se reinicia varias veces durante la jornada.',
    reporter: 'Miguel Torres',
    location: 'Oficina 407',
    priority: 'HIGH',
    status: 'OPEN',
    estimatedMinutes: 40,
    createdAt: new Date().toISOString(),
  },
];

function copyIncident(incident: Incident): Incident {
  return { ...incident };
}

/** Almacén temporal en memoria; reemplazable por una base de datos en otra versión. */
export class IncidentStore {
  private records: Incident[] = [];
  private nextId = 1;

  constructor(seed: readonly Incident[] = SEED_INCIDENTS) {
    this.reset(seed);
  }

  getAll(): Incident[] {
    return this.records.map(copyIncident);
  }

  findById(id: number): Incident | undefined {
    const incident = this.records.find((record) => record.id === id);
    return incident ? copyIncident(incident) : undefined;
  }

  create(dto: CreateIncidentDto): Incident {
    const incident: Incident = {
      ...dto,
      id: this.nextId,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };

    this.nextId += 1;
    this.records.push(incident);
    return copyIncident(incident);
  }

  update(id: number, dto: UpdateIncidentDto): Incident | undefined {
    const index = this.records.findIndex((record) => record.id === id);
    const current = this.records[index];

    if (!current || index < 0) {
      return undefined;
    }

    const updated: Incident = {
      ...current,
      title: dto.title,
      description: dto.description,
      reporter: dto.reporter ?? current.reporter,
      location: dto.location,
      priority: dto.priority,
      estimatedMinutes: dto.estimatedMinutes,
    };

    this.records[index] = updated;
    return copyIncident(updated);
  }

  updateStatus(id: number, status: Incident['status']): Incident | undefined {
    const index = this.records.findIndex((record) => record.id === id);
    const current = this.records[index];

    if (!current || index < 0) {
      return undefined;
    }

    const updated: Incident = { ...current, status };
    this.records[index] = updated;
    return copyIncident(updated);
  }

  delete(id: number): boolean {
    const index = this.records.findIndex((record) => record.id === id);

    if (index < 0) {
      return false;
    }

    this.records.splice(index, 1);
    return true;
  }

  /** Reinicia los datos semilla; se usa para aislar pruebas automatizadas. */
  reset(seed: readonly Incident[] = SEED_INCIDENTS): void {
    this.records = seed.map(copyIncident);
    this.nextId = this.records.reduce(
      (highestId, incident) => Math.max(highestId, incident.id),
      0,
    ) + 1;
  }
}

export const incidentStore = new IncidentStore();
