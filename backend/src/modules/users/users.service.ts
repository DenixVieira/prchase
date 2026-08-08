import bcrypt from "bcrypt";
import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import { User, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { auditService } from "../audit/audit.service";

export class UsersService {
  private repo = AppDataSource.getRepository(User);

  /**
   * Busca leve de usuários ativos, usada em pickers (atribuir responsável de
   * ticket, adicionar acompanhante etc.). Diferente de list(), não exige a
   * permissão administrativa MANAGE_USERS — qualquer usuário autenticado
   * pode buscar colegas para atribuir/marcar em um ticket. Retorna só os
   * campos necessários para exibição (sem e-mail, isAdmin etc.).
   */
  async search(req: Request) {
    const search = req.query.search ? String(req.query.search).trim() : undefined;
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "10"), 10) || 10, 1), 50);

    const qb = this.repo.createQueryBuilder("user")
      .leftJoinAndSelect("user.department", "department")
      .where("user.isActive = true");

    if (search) {
      qb.andWhere("(user.name ILIKE :search OR user.login ILIKE :search)", { search: `%${search}%` });
    }

    qb.orderBy("user.name", "ASC").take(limit);
    const items = await qb.getMany();
    return items.map((user) => ({
      id: user.id,
      name: user.name,
      login: user.login,
      department: user.department ? { id: user.department.id, name: user.department.name } : null,
    }));
  }

  async list(req: Request) {
    const { page, limit, skip, sortBy, sortOrder, search } = getPaginationParams(req, "name", [
      "name", "login", "email", "isActive", "isAdmin", "createdAt",
    ]);
    const qb = this.repo.createQueryBuilder("user").leftJoinAndSelect("user.department", "department");

    if (req.query.departmentId) qb.andWhere("user.departmentId = :departmentId", { departmentId: req.query.departmentId });
    if (req.query.isActive !== undefined) qb.andWhere("user.isActive = :isActive", { isActive: req.query.isActive === "true" });
    if (search) qb.andWhere("(user.name ILIKE :search OR user.login ILIKE :search OR user.email ILIKE :search)", { search: `%${search}%` });

    qb.orderBy(`user.${sortBy}`, sortOrder).skip(skip).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id }, relations: ["department"] });
    if (!user) throw ApiError.notFound("Usuário não encontrado");
    return user;
  }

  async create(actorId: string, dto: { name: string; login: string; email: string; password: string; departmentId?: string; isAdmin?: boolean }, req: Request) {
    const existing = await this.repo.findOne({ where: [{ login: dto.login }, { email: dto.email }] });
    if (existing) throw ApiError.conflict("Já existe um usuário com este login ou e-mail");

    const user = await this.repo.save(
      this.repo.create({
        name: dto.name,
        login: dto.login,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        departmentId: dto.departmentId ?? null,
        isAdmin: dto.isAdmin ?? false,
      })
    );

    await auditService.log({ userId: actorId, action: AuditAction.CREATE, entity: "User", entityId: user.id, req });
    return this.findByIdOrFail(user.id);
  }

  async update(actorId: string, id: string, dto: Record<string, unknown>, req: Request) {
    const user = await this.findByIdOrFail(id);
    Object.assign(user, dto);
    await this.repo.save(user);
    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "User", entityId: id, req });
    return this.findByIdOrFail(id);
  }

  async remove(actorId: string, id: string, req: Request) {
    await this.findByIdOrFail(id);
    await this.repo.softDelete(id);
    await auditService.log({ userId: actorId, action: AuditAction.DELETE, entity: "User", entityId: id, req });
  }

  async setActive(actorId: string, id: string, isActive: boolean, req: Request) {
    const user = await this.findByIdOrFail(id);
    user.isActive = isActive;
    await this.repo.save(user);
    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "User", entityId: id, req, metadata: { isActive } });
    return this.findByIdOrFail(id);
  }

  async resetPassword(actorId: string, id: string, newPassword: string, req: Request) {
    const user = await this.findByIdOrFail(id);
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.save(user);
    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "User", entityId: id, req, metadata: { passwordReset: true } });
  }

  async changeDepartment(actorId: string, id: string, departmentId: string, req: Request) {
    await this.findByIdOrFail(id);
    // update() em vez de carregar+mutar+save(): evita que a relação
    // "department" (carregada na leitura acima) sobrescreva a nova coluna.
    await this.repo.update(id, { departmentId });
    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "User", entityId: id, req, metadata: { departmentId } });
    return this.findByIdOrFail(id);
  }
}

export const usersService = new UsersService();
