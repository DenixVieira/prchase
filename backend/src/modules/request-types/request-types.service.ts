import { Request } from "express";
import { In } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { RequestType, RequestField, RequestFieldType, RequestTypeSourceKind, Organization, Department, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { auditService } from "../audit/audit.service";
import { filterAccessibleOrganizationIds } from "../../utils/organizationAccess";
import { hasSystemAdminAccess } from "../../utils/permissionAccess";
import { AuthenticatedUser } from "../../middlewares/types";
import { RequestFieldDto } from "./request-types.dto";

// Normaliza pra ASCII (NFKD decompõe acento da letra base, ex.: "ê" -> "e" +
// marca de acento, que o replace seguinte descarta por não ser a-z/0-9).
function slugify(label: string): string {
  return label
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100) || "campo";
}

const sortFields = (requestType: RequestType): RequestType => {
  requestType.fields?.sort((a, b) => a.order - b.order);
  return requestType;
};

const RELATIONS = ["department", "fields", "organizations", "visibleDepartments"];

export class RequestTypesService {
  private repo = AppDataSource.getRepository(RequestType);
  private fieldRepo = AppDataSource.getRepository(RequestField);
  private organizationRepo = AppDataSource.getRepository(Organization);
  private departmentRepo = AppDataSource.getRepository(Department);

  /**
   * O card semente de Compra (isBuiltIn/PURCHASE_REQUEST) ignora as listas de
   * organizações/departamentos — sempre visível, já que ela tem seu próprio
   * fluxo de escolha de organização dentro do formulário de Solicitação de
   * Compra. Para os demais, duas checagens em sequência:
   * 1. Organização: o departamento do usuário precisa acessar pelo menos uma
   *    das organizações marcadas; sem nenhuma marcada, fica oculto até o
   *    admin configurar (escolha deliberada, não "aberto por padrão").
   * 2. Departamento (opcional, complementar): se além disso o admin marcou
   *    departamentos específicos, só esses enxergam — mesmo que outro
   *    departamento tenha acesso às mesmas organizações. Vazio = sem essa
   *    restrição extra, só a de organização vale (compatível com todo tipo
   *    criado antes desta segunda camada existir).
   *
   * `isPrivileged` (admin do sistema/SYSTEM_ADMIN) sempre vê tudo, inclusive
   * tipos restritos a outro departamento — mesmo bypass usado em qualquer
   * outra checagem de departamento no sistema (ex.: tickets.service.ts).
   * Calculado uma vez por chamada (não por item) e passado pronto aqui, já
   * que `hasSystemAdminAccess` é assíncrono.
   */
  private isVisibleTo(user: AuthenticatedUser, requestType: RequestType, isPrivileged: boolean): boolean {
    if (requestType.sourceKind === RequestTypeSourceKind.PURCHASE_REQUEST) return true;
    if (isPrivileged) return true;

    const organizationIds = (requestType.organizations ?? []).map((o) => o.id);
    if (organizationIds.length === 0) return false;
    if (filterAccessibleOrganizationIds(user, organizationIds).length === 0) return false;

    const visibleDepartmentIds = (requestType.visibleDepartments ?? []).map((d) => d.id);
    if (visibleDepartmentIds.length === 0) return true;
    return !!user.departmentId && visibleDepartmentIds.includes(user.departmentId);
  }

  /** Card grid de "Nova Solicitação" — só os tipos visíveis pro departamento do usuário. */
  async listActive(user: AuthenticatedUser): Promise<RequestType[]> {
    const items = await this.repo.find({
      where: { isActive: true },
      relations: RELATIONS,
      order: { name: "ASC" },
    });
    const isPrivileged = await hasSystemAdminAccess(user);
    return items.filter((rt) => this.isVisibleTo(user, rt, isPrivileged)).map(sortFields);
  }

  /** Listagem completa (inclusive inativos e sem restrição de organização) para a tela administrativa. */
  async listAll(): Promise<RequestType[]> {
    const items = await this.repo.find({
      relations: RELATIONS,
      order: { name: "ASC" },
    });
    return items.map(sortFields);
  }

  async findByIdOrFail(id: string): Promise<RequestType> {
    const requestType = await this.repo.findOne({ where: { id }, relations: RELATIONS });
    if (!requestType) throw ApiError.notFound("Tipo de solicitação não encontrado");
    return sortFields(requestType);
  }

  /**
   * Mesma busca, mas aplicando a regra de visibilidade por organização —
   * usada pelo endpoint público (GET /request-types/:id), pra um usuário sem
   * MANAGE_REQUEST_TYPES não conseguir ler os campos de um tipo que nem
   * deveria aparecer pra ele (ex.: navegando direto pra /requests/new/:id).
   * Erro genérico de "não encontrado" de propósito — não entrega se o tipo
   * existe mas está fora do alcance do usuário.
   */
  async findVisibleOrFail(id: string, user: AuthenticatedUser): Promise<RequestType> {
    const requestType = await this.findByIdOrFail(id);
    const isPrivileged = await hasSystemAdminAccess(user);
    if (!this.isVisibleTo(user, requestType, isPrivileged)) {
      throw ApiError.notFound("Tipo de solicitação não encontrado");
    }
    return requestType;
  }

  private async resolveOrganizations(organizationIds: string[] | undefined): Promise<Organization[] | undefined> {
    if (organizationIds === undefined) return undefined;
    if (organizationIds.length === 0) return [];
    const organizations = await this.organizationRepo.find({ where: { id: In(organizationIds) } });
    if (organizations.length !== new Set(organizationIds).size) {
      throw ApiError.badRequest("Uma ou mais organizações informadas não existem");
    }
    return organizations;
  }

  private async resolveVisibleDepartments(departmentIds: string[] | undefined): Promise<Department[] | undefined> {
    if (departmentIds === undefined) return undefined;
    if (departmentIds.length === 0) return [];
    const departments = await this.departmentRepo.find({ where: { id: In(departmentIds) } });
    if (departments.length !== new Set(departmentIds).size) {
      throw ApiError.badRequest("Um ou mais departamentos informados não existem");
    }
    return departments;
  }

  async create(
    actorId: string,
    dto: { name: string; description?: string; departmentId: string; icon?: string; organizationIds?: string[]; visibleDepartmentIds?: string[] },
    req: Request
  ): Promise<RequestType> {
    const existing = await this.repo.findOne({ where: { name: dto.name } });
    if (existing) throw ApiError.conflict("Já existe um tipo de solicitação com este nome");

    const organizations = await this.resolveOrganizations(dto.organizationIds);
    const visibleDepartments = await this.resolveVisibleDepartments(dto.visibleDepartmentIds);
    const requestType = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      departmentId: dto.departmentId,
      icon: dto.icon ?? null,
      organizations: organizations ?? [],
      visibleDepartments: visibleDepartments ?? [],
    });
    await this.repo.save(requestType);

    await auditService.log({ userId: actorId, action: AuditAction.CREATE, entity: "RequestType", entityId: requestType.id, req });
    return this.findByIdOrFail(requestType.id);
  }

  async update(
    actorId: string,
    id: string,
    dto: {
      name?: string; description?: string; departmentId?: string; icon?: string; isActive?: boolean;
      organizationIds?: string[]; visibleDepartmentIds?: string[];
    },
    req: Request
  ): Promise<RequestType> {
    const requestType = await this.findByIdOrFail(id);
    if (requestType.isBuiltIn) {
      throw ApiError.badRequest("O tipo de solicitação de Compra não pode ser editado");
    }
    if (dto.name && dto.name !== requestType.name) {
      const existing = await this.repo.findOne({ where: { name: dto.name } });
      if (existing) throw ApiError.conflict("Já existe um tipo de solicitação com este nome");
    }

    const { organizationIds, visibleDepartmentIds, ...columns } = dto;
    // update() em vez de carregar+mutar+save() pras colunas simples: como
    // "department" (relação eager) mapeia a mesma coluna de departmentId,
    // salvar a entidade inteira arriscaria o TypeORM reescrever o valor a
    // partir da relação já carregada (desatualizada) — mesmo cuidado de
    // departmentsService.update().
    if (Object.keys(columns).length > 0) {
      await this.repo.update(id, columns);
    }

    const organizations = await this.resolveOrganizations(organizationIds);
    const visibleDepartments = await this.resolveVisibleDepartments(visibleDepartmentIds);
    if (organizations !== undefined || visibleDepartments !== undefined) {
      // As relações M2M só podem ser sincronizadas via entidade — aqui não há
      // o mesmo risco de acima, pois não tocamos em nenhuma coluna simples
      // nesta chamada.
      const fresh = await this.findByIdOrFail(id);
      if (organizations !== undefined) fresh.organizations = organizations;
      if (visibleDepartments !== undefined) fresh.visibleDepartments = visibleDepartments;
      await this.repo.save(fresh);
    }

    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "RequestType", entityId: id, req });
    return this.findByIdOrFail(id);
  }

  async remove(actorId: string, id: string, req: Request): Promise<void> {
    const requestType = await this.findByIdOrFail(id);
    if (requestType.isBuiltIn) {
      throw ApiError.badRequest("O tipo de solicitação de Compra não pode ser removido");
    }
    await this.repo.softDelete(id);
    await auditService.log({ userId: actorId, action: AuditAction.DELETE, entity: "RequestType", entityId: id, req });
  }

  /**
   * Substitui a lista de campos por inteiro (delete+recreate), mesmo padrão
   * de departmentsService.updatePermissions — mais simples e previsível do
   * que tentar casar/atualizar campos individualmente pela key.
   */
  async replaceFields(actorId: string, id: string, fields: RequestFieldDto[], req: Request): Promise<RequestType> {
    const requestType = await this.findByIdOrFail(id);
    if (requestType.isBuiltIn) {
      throw ApiError.badRequest("Os campos do tipo de solicitação de Compra não podem ser editados por aqui");
    }

    const seenKeys = new Set<string>();
    const rows = fields.map((field, index) => {
      if ((field.type === RequestFieldType.SELECT || field.type === RequestFieldType.MULTISELECT) && !field.options?.length) {
        throw ApiError.badRequest(`O campo "${field.label}" precisa de ao menos uma opção`);
      }
      let key = field.key ? slugify(field.key) : slugify(field.label);
      let suffix = 2;
      while (seenKeys.has(key)) {
        key = `${slugify(field.key ?? field.label)}_${suffix}`;
        suffix += 1;
      }
      seenKeys.add(key);

      return this.fieldRepo.create({
        requestTypeId: id,
        label: field.label,
        key,
        type: field.type,
        required: field.required ?? false,
        options: field.options ?? null,
        helpText: field.helpText ?? null,
        order: index,
      });
    });

    await AppDataSource.transaction(async (manager) => {
      await manager.delete(RequestField, { requestTypeId: id });
      if (rows.length > 0) await manager.save(rows);
    });

    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "RequestType", entityId: id, req, metadata: { fieldsCount: rows.length } });
    return this.findByIdOrFail(id);
  }
}

export const requestTypesService = new RequestTypesService();
