import { AppDataSource } from "../config/data-source";
import { DepartmentPermission, PermissionKey } from "../database/entities";
import { AuthenticatedUser } from "../middlewares/types";

/**
 * true quando o usuário tem acesso irrestrito (admin do sistema ou permissão
 * SYSTEM_ADMIN no departamento) — mesma regra usada pelo middleware
 * `authorize`, mas exposta pra uso dentro de services que precisam decidir
 * um comportamento diferente pra quem tem acesso total (ex.: escopo por
 * departamento no Kanban).
 */
export async function hasSystemAdminAccess(user: AuthenticatedUser): Promise<boolean> {
  if (user.isAdmin) return true;
  if (!user.departmentId) return false;

  const deptPermRepo = AppDataSource.getRepository(DepartmentPermission);
  const grant = await deptPermRepo.findOne({
    where: { departmentId: user.departmentId, granted: true, permission: { key: PermissionKey.SYSTEM_ADMIN } },
    relations: ["permission"],
  });
  return !!grant;
}

/**
 * true quando o usuário tem uma permissão específica (via SYSTEM_ADMIN/admin
 * ou a própria permissão concedida ao departamento) — mesma regra do
 * middleware `authorize`, exposta pra uso dentro de services que precisam
 * decidir um comportamento diferente conforme a permissão (ex.: mostrar
 * campos de um Tipo de Solicitação mesmo se ele não estiver "visível" pra
 * um usuário comum, quando quem pede é MANAGE_REQUEST_TYPES).
 */
export async function hasPermission(user: AuthenticatedUser, key: PermissionKey): Promise<boolean> {
  if (await hasSystemAdminAccess(user)) return true;
  if (!user.departmentId) return false;

  const deptPermRepo = AppDataSource.getRepository(DepartmentPermission);
  const grant = await deptPermRepo.findOne({
    where: { departmentId: user.departmentId, granted: true, permission: { key } },
    relations: ["permission"],
  });
  return !!grant;
}
