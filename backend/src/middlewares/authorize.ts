import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { AppDataSource } from "../config/data-source";
import { DepartmentPermission, PermissionKey } from "../database/entities";

/**
 * Middleware de RBAC. As permissões pertencem ao Departamento; todo usuário
 * herda automaticamente as permissões do seu departamento. Administradores
 * do sistema (isAdmin ou permissão SYSTEM_ADMIN) têm acesso irrestrito.
 * Basta possuir UMA das permissões informadas para passar (modo "OR").
 */
export function authorize(...permissionKeys: PermissionKey[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized();
      }
      if (req.user.isAdmin) {
        return next();
      }
      if (!req.user.departmentId) {
        throw ApiError.forbidden("Usuário sem departamento vinculado não possui permissões");
      }

      const deptPermRepo = AppDataSource.getRepository(DepartmentPermission);
      const grants = await deptPermRepo.find({
        where: { departmentId: req.user.departmentId, granted: true },
        relations: ["permission"],
      });
      const grantedKeys = new Set(grants.map((g) => g.permission.key));

      if (grantedKeys.has(PermissionKey.SYSTEM_ADMIN)) {
        return next();
      }
      const hasPermission = permissionKeys.some((key) => grantedKeys.has(key));
      if (!hasPermission) {
        throw ApiError.forbidden();
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
