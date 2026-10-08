import type {
  IncidentPriority,
  IncidentStatus,
} from '../models/incident.model';

/** Campos que un cliente puede enviar al registrar un incidente. */
export interface CreateIncidentDto {
  title: string;
  description: string;
  reporter: string;
  location: string;
  priority: IncidentPriority;
  estimatedMinutes: number;
}

/** Campos editables con PUT; reporter es opcional y, si se omite, se conserva. */
export interface UpdateIncidentDto {
  title: string;
  description: string;
  reporter?: string;
  location: string;
  priority: IncidentPriority;
  estimatedMinutes: number;
}

/** DTO específico para cambiar únicamente el estado. */
export interface UpdateIncidentStatusDto {
  status: IncidentStatus;
}
