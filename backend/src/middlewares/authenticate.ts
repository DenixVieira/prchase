import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { AppDataSource } from "../config/data-source";
import { User } from "../database/entities";

interface AccessTokenPayload {
  sub: string;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Token de acesso ausente");
    }
    const token = header.substring("Bearer ".length);
    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, env.jwt.secret) as AccessTokenPayload;
    } catch {
      throw ApiError.unauthorized("Token de acesso inválido ou expirado");
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: payload.sub },
      relations: ["department", "department.homeOrganization", "department.allowedOrganizations"],
    });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Usuário inválido, inativo ou não encontrado");
    }

    const hasFullAccess = user.isAdmin || user.department?.hasFullOrganizationAccess === true;
    const homeOrganizationId = user.department?.homeOrganizationId ?? null;
    const allowedOrganizationIds = Array.from(
      new Set([
        ...(homeOrganizationId ? [homeOrganizationId] : []),
        ...((user.department?.allowedOrganizations ?? []).map((o) => o.id)),
      ])
    );

    req.user = {
      id: user.id,
      login: user.login,
      email: user.email,
      name: user.name,
      departmentId: user.departmentId ?? null,
      isAdmin: user.isAdmin,
      organizationAccess: { hasFullAccess, homeOrganizationId, allowedOrganizationIds },
    };
    next();
  } catch (error) {
    next(error);
  }
}
