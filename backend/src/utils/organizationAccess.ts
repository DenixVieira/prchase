import { AuthenticatedUser } from "../middlewares/types";
import { ApiError } from "./ApiError";
import { AppDataSource } from "../config/data-source";
import { User } from "../database/entities";

/**
 * Retorna os IDs de organização que o usuário pode acessar, ou `null` quando
 * o acesso é irrestrito (administrador ou departamento com acesso total).
 */
export function getAccessibleOrganizationIds(user: AuthenticatedUser): string[] | null {
  if (user.organizationAccess.hasFullAccess) return null;
  return user.organizationAccess.allowedOrganizationIds;
}

/**
 * Registros legados sem organização definida (organizationId null/undefined)
 * permanecem visíveis a todos — só restringe quando o registro tem uma
 * organização explícita e o usuário não tem acesso irrestrito.
 */
export function hasOrganizationAccess(user: AuthenticatedUser, organizationId: string | null | undefined): boolean {
  if (!organizationId) return true;
  const accessible = getAccessibleOrganizationIds(user);
  if (accessible === null) return true;
  return accessible.includes(organizationId);
}

export function assertOrganizationAccess(user: AuthenticatedUser, organizationId: string | null | undefined): void {
  if (!hasOrganizationAccess(user, organizationId)) {
    throw ApiError.forbidden("Seu departamento não tem acesso à organização deste registro");
  }
}

/**
 * Filtra uma lista de IDs de organização (ex.: as organizações configuradas
 * num RequestType) para as que o usuário de fato acessa — usado para decidir
 * se um Tipo de Solicitação restrito por organização deve aparecer/ser aceito
 * para este usuário, e para não oferecer no formulário uma organização que
 * o tipo permite mas o departamento do usuário não acessa (ou vice-versa).
 */
export function filterAccessibleOrganizationIds(user: AuthenticatedUser, candidateIds: string[]): string[] {
  const accessible = getAccessibleOrganizationIds(user);
  if (accessible === null) return candidateIds;
  const accessibleSet = new Set(accessible);
  return candidateIds.filter((id) => accessibleSet.has(id));
}

/**
 * Mesma regra de acesso por organização, mas para um usuário-ALVO (ex.: quem
 * está sendo atribuído/adicionado como acompanhante de um ticket), não para
 * quem está fazendo a requisição. Sem essa checagem, dava pra atribuir ou
 * adicionar como acompanhante um usuário sem nenhum acesso à organização do
 * ticket — e ele passava a receber todas as notificações dali por diante.
 */
export async function assertTargetUserOrganizationAccess(
  userId: string,
  organizationId: string | null | undefined
): Promise<void> {
  if (!organizationId) return;

  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: userId },
    relations: ["department", "department.allowedOrganizations"],
  });
  if (!user) throw ApiError.notFound("Usuário não encontrado");

  const hasFullAccess = user.isAdmin || user.department?.hasFullOrganizationAccess === true;
  if (hasFullAccess) return;

  const allowedOrganizationIds = new Set<string>([
    ...(user.department?.homeOrganizationId ? [user.department.homeOrganizationId] : []),
    ...(user.department?.allowedOrganizations ?? []).map((o) => o.id),
  ]);
  if (!allowedOrganizationIds.has(organizationId)) {
    throw ApiError.badRequest("Este usuário não tem acesso à organização deste ticket");
  }
}
