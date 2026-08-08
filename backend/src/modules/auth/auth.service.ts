import bcrypt from "bcrypt";
import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import { User, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { TokenService } from "./token.service";
import { auditService } from "../audit/audit.service";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private tokenService = new TokenService();

  async login(login: string, password: string, req: Request) {
    // Precisa carregar department.permissions.permission aqui (não só
    // "department"), senão o usuário recebe a lista de permissões vazia
    // logo após o login e só vê as opções corretas depois de um F5 — momento
    // em que /auth/me (que já carrega essas relações) é chamado.
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .leftJoinAndSelect("user.department", "department")
      .leftJoinAndSelect("department.permissions", "departmentPermissions")
      .leftJoinAndSelect("departmentPermissions.permission", "permission")
      .leftJoinAndSelect("department.homeOrganization", "homeOrganization")
      .leftJoinAndSelect("department.allowedOrganizations", "allowedOrganizations")
      .where("user.login = :login OR user.email = :login", { login })
      .getOne();

    if (!user) {
      throw ApiError.unauthorized("Login ou senha inválidos");
    }
    if (!user.isActive) {
      throw ApiError.forbidden("Usuário bloqueado. Contate o administrador.");
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw ApiError.unauthorized("Login ou senha inválidos");
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user, req.ip);

    await auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entity: "User",
      entityId: user.id,
      req,
    });

    return {
      accessToken,
      refreshToken,
      user: this.toSafeUser(user),
    };
  }

  async refresh(refreshToken: string, req: Request) {
    const result = await this.tokenService.rotateRefreshToken(refreshToken, req.ip);
    if (!result) {
      throw ApiError.unauthorized("Refresh token inválido ou expirado");
    }
    return result;
  }

  async logout(userId: string, req: Request) {
    await this.tokenService.revokeAllForUser(userId);
    await auditService.log({ userId, action: AuditAction.LOGOUT, entity: "User", entityId: userId, req });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id: userId })
      .getOne();
    if (!user) throw ApiError.notFound("Usuário não encontrado");

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw ApiError.badRequest("Senha atual incorreta");

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
    await this.tokenService.revokeAllForUser(userId);
  }

  /**
   * Exige a senha atual (mesma proteção usada na troca de senha) para evitar
   * que uma sessão sequestrada troque o e-mail de recuperação da conta.
   */
  async changeEmail(userId: string, currentPassword: string, newEmail: string, req: Request) {
    const user = await this.userRepo
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.id = :id", { id: userId })
      .getOne();
    if (!user) throw ApiError.notFound("Usuário não encontrado");

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) throw ApiError.badRequest("Senha atual incorreta");

    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      throw ApiError.badRequest("O novo e-mail deve ser diferente do atual");
    }

    const existing = await this.userRepo
      .createQueryBuilder("user")
      .where("LOWER(user.email) = LOWER(:email)", { email: newEmail })
      .getOne();
    if (existing) throw ApiError.conflict("Este e-mail já está em uso por outro usuário");

    user.email = newEmail;
    await this.userRepo.save(user);
    await auditService.log({ userId, action: AuditAction.UPDATE, entity: "User", entityId: userId, req, metadata: { field: "email" } });

    return this.toSafeUser(user);
  }

  async me(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: [
        "department", "department.permissions", "department.permissions.permission",
        "department.homeOrganization", "department.allowedOrganizations",
      ],
    });
    if (!user) throw ApiError.notFound("Usuário não encontrado");
    return this.toSafeUser(user);
  }

  private toSafeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      login: user.login,
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      notificationPreference: user.notificationPreference,
      mutedNotificationTypes: user.mutedNotificationTypes ?? [],
      department: user.department
        ? {
            id: user.department.id,
            name: user.department.name,
            permissions: user.department.permissions?.map((p) => p.permission.key) ?? [],
            homeOrganization: user.department.homeOrganization
              ? { id: user.department.homeOrganization.id, name: user.department.homeOrganization.name }
              : null,
            hasFullOrganizationAccess: user.department.hasFullOrganizationAccess,
            allowedOrganizations: (user.department.allowedOrganizations ?? []).map((o) => ({ id: o.id, name: o.name })),
          }
        : null,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
