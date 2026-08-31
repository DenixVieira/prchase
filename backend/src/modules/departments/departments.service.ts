import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import { Department, DepartmentPermission, Permission, PermissionKey, AuditAction, Organization } from "../../database/entities";
import { In, DeepPartial } from "typeorm";
import { ApiError } from "../../utils/ApiError";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { auditService } from "../audit/audit.service";
import { boardsService } from "../boards/boards.service";

type DepartmentUpsertDto = {
  name?: string;
  description?: string;
  responsibleUserId?: string;
  isActive?: boolean;
  homeOrganizationId?: string;
  hasFullOrganizationAccess?: boolean;
  allowedOrganizationIds?: string[];
  departmentGroupId?: string | null;
};

export class DepartmentsService {
  private repo = AppDataSource.getRepository(Department);
  private permissionRepo = AppDataSource.getRepository(Permission);
  private organizationRepo = AppDataSource.getRepository(Organization);

  /**
   * Lista simplificada (sem paginação, sem relações administrativas) para
   * preencher selects/filtros no frontend — liberada a qualquer usuário
   * autenticado, ao contrário de list() que exige MANAGE_DEPARTMENTS/
   * MANAGE_USERS. Sem isso, telas como Equipamentos e Solicitações (usadas
   * por departamentos sem permissão administrativa) não conseguem carregar
   * o próprio filtro de departamento.
   */
  async listActive() {
    return this.repo.find({ where: { isActive: true }, order: { name: "ASC" } });
  }

  async list(req: Request) {
    const { page, limit, skip, sortBy, sortOrder, search } = getPaginationParams(req, "name", ["name", "isActive", "createdAt"]);
    const qb = this.repo.createQueryBuilder("department")
      .leftJoinAndSelect("department.responsible", "responsible")
      .leftJoinAndSelect("department.permissions", "permissions")
      .leftJoinAndSelect("permissions.permission", "permission")
      .leftJoinAndSelect("department.homeOrganization", "homeOrganization")
      .leftJoinAndSelect("department.allowedOrganizations", "allowedOrganizations")
      .leftJoinAndSelect("department.group", "group")
      .leftJoinAndSelect("group.organization", "groupOrganization");

    if (search) qb.andWhere("department.name ILIKE :search", { search: `%${search}%` });
    if (req.query.isActive !== undefined) qb.andWhere("department.isActive = :isActive", { isActive: req.query.isActive === "true" });

    qb.orderBy(`department.${sortBy}`, sortOrder).skip(skip).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findByIdOrFail(id: string): Promise<Department> {
    const department = await this.repo.findOne({
      where: { id },
      relations: ["responsible", "permissions", "permissions.permission", "homeOrganization", "allowedOrganizations", "group", "group.organization"],
    });
    if (!department) throw ApiError.notFound("Departamento não encontrado");
    return department;
  }

  /** Separa allowedOrganizationIds (relação M2M) do restante das colunas simples da entidade. */
  private async applyOrganizationAccess(department: Department, dto: DepartmentUpsertDto) {
    if (dto.allowedOrganizationIds !== undefined) {
      department.allowedOrganizations = dto.allowedOrganizationIds.length
        ? await this.organizationRepo.findBy({ id: In(dto.allowedOrganizationIds) })
        : [];
    }
  }

  async create(actorId: string, dto: DepartmentUpsertDto, req: Request) {
    // withDeleted: sem isso, um nome igual ao de um departamento já excluído
    // (soft delete) passava batido aqui e só estourava na constraint UNIQUE
    // do banco lá na hora do INSERT — erro genérico "Erro interno do
    // servidor" em vez de uma mensagem que explica o que aconteceu.
    const existing = await this.repo.findOne({ where: { name: dto.name }, withDeleted: true });
    if (existing?.deletedAt) {
      throw ApiError.conflict("Já existe um departamento excluído com este nome. Escolha outro nome ou peça a um administrador para restaurá-lo.");
    }
    if (existing) throw ApiError.conflict("Já existe um departamento com este nome");

    const { allowedOrganizationIds, ...columns } = dto;
    const department = this.repo.create(columns as DeepPartial<Department>);
    await this.applyOrganizationAccess(department, dto);
    await this.repo.save(department);
    // Todo departamento precisa nascer com um board (Ticket exige columnId
    // válido pra existir) — ver boardsService.provisionBoard.
    await boardsService.provisionBoard(department);

    await auditService.log({ userId: actorId, action: AuditAction.CREATE, entity: "Department", entityId: department.id, req });
    return this.findByIdOrFail(department.id);
  }

  async update(actorId: string, id: string, dto: DepartmentUpsertDto, req: Request) {
    await this.findByIdOrFail(id);
    const { allowedOrganizationIds, ...columns } = dto;

    // update() em vez de carregar+mutar+save(): como homeOrganization/
    // responsible (relações eager/carregadas) mapeiam as mesmas colunas de
    // homeOrganizationId/responsibleUserId, salvar a entidade inteira
    // arriscaria o TypeORM reescrever o valor a partir da relação já
    // carregada (desatualizada), perdendo a alteração.
    if (Object.keys(columns).length > 0) {
      await this.repo.update(id, columns);
    }

    if (allowedOrganizationIds !== undefined) {
      // A relação M2M (allowedOrganizations) só pode ser sincronizada via
      // entidade — aqui não há o mesmo risco, pois não tocamos em
      // homeOrganizationId/nenhuma outra coluna simples nesta operação.
      const department = await this.findByIdOrFail(id);
      await this.applyOrganizationAccess(department, dto);
      await this.repo.save(department);
    }

    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "Department", entityId: id, req });
    return this.findByIdOrFail(id);
  }

  async remove(actorId: string, id: string, req: Request) {
    await this.findByIdOrFail(id);
    await this.repo.softDelete(id);
    await auditService.log({ userId: actorId, action: AuditAction.DELETE, entity: "Department", entityId: id, req });
  }

  async updatePermissions(actorId: string, id: string, permissionKeys: PermissionKey[], req: Request) {
    await this.findByIdOrFail(id);

    // Substituição completa (delete + reinsert) precisa ser atômica: sem a
    // transação, dois PUTs concorrentes para o mesmo departamento (ex.:
    // duplo clique numa permissão, que dispara dois toggles antes do
    // primeiro terminar) podiam intercalar — um DELETE de um request depois
    // do INSERT do outro apagava tudo, ou os dois INSERTs duplicavam linhas.
    // Isso é o que causava permissões "grudando" marcadas/desmarcadas
    // incorretamente depois de cliques rápidos em sequência.
    await AppDataSource.transaction(async (manager) => {
      await manager.delete(DepartmentPermission, { departmentId: id });
      const permissions = permissionKeys.length > 0
        ? await manager.find(Permission, { where: { key: In(permissionKeys) } })
        : [];
      if (permissions.length > 0) {
        await manager.save(
          permissions.map((permission) => manager.create(DepartmentPermission, { departmentId: id, permissionId: permission.id, granted: true }))
        );
      }
    });

    await auditService.log({ userId: actorId, action: AuditAction.PERMISSION_CHANGE, entity: "Department", entityId: id, req, metadata: { permissionKeys } });
    return this.findByIdOrFail(id);
  }

  async listAllPermissions() {
    return this.permissionRepo.find({ order: { key: "ASC" } });
  }
}

export const departmentsService = new DepartmentsService();
