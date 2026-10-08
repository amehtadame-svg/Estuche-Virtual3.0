export type UserRole = 'ADMIN' | 'TECHNICIAN';

export interface AuthenticatedUser {
  username: string;
  role: UserRole;
}

export interface RequestInfo {
  timestamp: string;
  method: string;
  path: string;
}
