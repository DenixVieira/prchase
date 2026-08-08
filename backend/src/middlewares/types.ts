export interface OrganizationAccess {
  /** true = irrestrito, enxerga/interage com todas as organizações (admins e departamentos com acesso total). */
  hasFullAccess: boolean;
  /** Organização "padrão" do departamento do usuário (sugerida ao criar novas solicitações). */
  homeOrganizationId: string | null;
  /** IDs de todas as organizações que o usuário pode acessar (homeOrganization + permitidas), quando hasFullAccess é false. */
  allowedOrganizationIds: string[];
}

export interface AuthenticatedUser {
  id: string;
  login: string;
  email: string;
  name: string;
  departmentId: string | null;
  isAdmin: boolean;
  organizationAccess: OrganizationAccess;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
