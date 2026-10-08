export const INCIDENT_PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
] as const;

export type IncidentPriority = (typeof INCIDENT_PRIORITIES)[number];

export const INCIDENT_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

/** Representa un incidente completo dentro de la aplicación. */
export interface Incident {
  id: number;
  title: string;
  description: string;
  reporter: string;
  location: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  estimatedMinutes: number;
  createdAt: string;
}
