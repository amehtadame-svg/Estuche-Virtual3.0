import type {
  CreateIncidentDto,
  UpdateIncidentDto,
  UpdateIncidentStatusDto,
} from '../dtos/incident.dto';
import type {
  AuthenticatedUser,
  RequestInfo,
} from '../models/request.model';

declare global {
  namespace Express {
    interface Request {
      requestInfo?: RequestInfo;
      user?: AuthenticatedUser;
      validatedIncident?: CreateIncidentDto | UpdateIncidentDto;
      validatedStatus?: UpdateIncidentStatusDto;
    }
  }
}

export {};
