import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import { Organization, Attachment, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { auditService } from "../audit/audit.service";
import { AuthenticatedUser } from "../../middlewares/types";
import { getAccessibleOrganizationIds, assertOrganizationAccess } from "../../utils/organizationAccess";
import { In } from "typeorm";

const ORGANIZATION_INVOICE_EXPORT_MAX_RANGE_DAYS = 30;

export class OrganizationsService {
  private repo = AppDataSource.getRepository(Organization);

  async list(req: Request) {
    const { page, limit, skip, sortBy, sortOrder, search } = getPaginationParams(req, "name", ["name", "isActive", "createdAt"]);
    const qb = this.repo.createQueryBuilder("organization");

    if (search) qb.andWhere("organization.name ILIKE :search", { search: `%${search}%` });
    if (req.query.isActive !== undefined) {
      qb.andWhere("organization.isActive = :isActive", { isActive: req.query.isActive === "true" });
    }

    qb.orderBy(`organization.${sortBy}`, sortOrder).skip(skip).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  /** Lista simplificada, sem paginação, para preencher selects no frontend. */
  async listActive() {
    return this.repo.find({ where: { isActive: true }, order: { name: "ASC" } });
  }

  /**
   * Organizações que o usuário logado pode escolher ao criar uma solicitação
   * de compra: todas (se o departamento tem acesso total) ou só as
   * acessíveis (organização principal + extras permitidas ao departamento).
   */
  async myAccessible(user: AuthenticatedUser) {
    const accessibleIds = getAccessibleOrganizationIds(user);
    if (accessibleIds === null) return this.listActive();
    if (accessibleIds.length === 0) return [];
    return this.repo.find({ where: { id: In(accessibleIds), isActive: true }, order: { name: "ASC" } });
  }

  async findByIdOrFail(id: string): Promise<Organization> {
    const organization = await this.repo.findOne({ where: { id } });
    if (!organization) throw ApiError.notFound("Organização não encontrada");
    return organization;
  }

  async create(actorId: string, dto: { name: string; description?: string }, req: Request) {
    // withDeleted: sem isso, um nome igual ao de uma organização já excluída
    // (soft delete) passava batido aqui e só estourava na constraint UNIQUE
    // do banco lá na hora do INSERT — erro genérico "Erro interno do
    // servidor" em vez de uma mensagem que explica o que aconteceu.
    const existing = await this.repo.findOne({ where: { name: dto.name }, withDeleted: true });
    if (existing?.deletedAt) {
      throw ApiError.conflict("Já existe uma organização excluída com este nome. Escolha outro nome ou peça a um administrador para restaurá-la.");
    }
    if (existing) throw ApiError.conflict("Já existe uma organização com este nome");

    const organization = await this.repo.save(this.repo.create(dto));
    await auditService.log({ userId: actorId, action: AuditAction.CREATE, entity: "Organization", entityId: organization.id, req });
    return organization;
  }

  async update(actorId: string, id: string, dto: Record<string, unknown>, req: Request) {
    const organization = await this.findByIdOrFail(id);
    Object.assign(organization, dto);
    await this.repo.save(organization);
    await auditService.log({ userId: actorId, action: AuditAction.UPDATE, entity: "Organization", entityId: id, req });
    return this.findByIdOrFail(id);
  }

  async remove(actorId: string, id: string, req: Request) {
    await this.findByIdOrFail(id);
    await this.repo.softDelete(id);
    await auditService.log({ userId: actorId, action: AuditAction.DELETE, entity: "Organization", entityId: id, req });
  }

  /**
   * Notas fiscais anexadas a tickets desta organização dentro do período
   * informado — usada tanto para montar o ZIP de exportação quanto para a
   * aba de consulta (lista com data de vencimento). Exige que o usuário
   * tenha acesso à organização escolhida (não basta estar autenticado).
   */
  async getInvoiceAttachmentsForExport(
    user: AuthenticatedUser,
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<{ organization: Organization; attachments: Attachment[] }> {
    if (!startDate || !endDate) {
      throw ApiError.badRequest("Informe o período (data inicial e final) para exportar as notas fiscais");
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw ApiError.badRequest("Datas inválidas");
    }
    if (end < start) {
      throw ApiError.badRequest("A data final deve ser maior ou igual à data inicial");
    }
    // Limita o período a 30 dias: sem isso, um intervalo muito amplo (ex.:
    // "o ano inteiro") força a compactação síncrona de um volume de arquivos
    // sem limite dentro de uma única requisição HTTP.
    const rangeDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (rangeDays > ORGANIZATION_INVOICE_EXPORT_MAX_RANGE_DAYS) {
      throw ApiError.badRequest(`O intervalo máximo para exportação é de ${ORGANIZATION_INVOICE_EXPORT_MAX_RANGE_DAYS} dias`);
    }
    assertOrganizationAccess(user, organizationId);
    const organization = await this.findByIdOrFail(organizationId);

    const attachments = await AppDataSource.getRepository(Attachment)
      .createQueryBuilder("a")
      .innerJoinAndSelect("a.ticket", "t")
      .where("a.isInvoiceNote = :isInvoiceNote", { isInvoiceNote: true })
      .andWhere("t.organizationId = :organizationId", { organizationId })
      .andWhere("a.createdAt >= :startDate", { startDate })
      // Fim do dia informado, para incluir todos os registros daquela data.
      .andWhere("a.createdAt <= :endDate", { endDate: `${endDate} 23:59:59.999` })
      .orderBy("a.createdAt", "ASC")
      .getMany();

    return { organization, attachments };
  }
}

export const organizationsService = new OrganizationsService();
