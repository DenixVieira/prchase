import { AppDataSource } from "../../config/data-source";
import { PurchaseRequest, Ticket, History, Notification, PurchaseRequestStatus } from "../../database/entities";
import { AuthenticatedUser } from "../../middlewares/types";
import { getAccessibleOrganizationIds, assertOrganizationAccess } from "../../utils/organizationAccess";
import { SelectQueryBuilder } from "typeorm";

export interface DashboardFilters {
  organizationId?: string;
  /** Data inicial (inclusive), filtrando por data de criação do registro. */
  startDate?: string;
  /** Data final (inclusive), filtrando por data de criação do registro. */
  endDate?: string;
}

export class DashboardService {
  private purchaseRequestRepo = AppDataSource.getRepository(PurchaseRequest);
  private ticketRepo = AppDataSource.getRepository(Ticket);
  private historyRepo = AppDataSource.getRepository(History);
  private notificationRepo = AppDataSource.getRepository(Notification);

  /**
   * Restringe uma query de solicitações/tickets às organizações que o usuário
   * pode acessar (mesma regra usada nas listagens). Registros legados sem
   * organização definida continuam contando para todos, para não "sumir" do
   * dashboard de ninguém.
   */
  private restrictToAccessibleOrganizations<T extends { organizationId?: string | null }>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    user: AuthenticatedUser
  ): SelectQueryBuilder<T> {
    const accessibleOrganizationIds = getAccessibleOrganizationIds(user);
    if (accessibleOrganizationIds === null) return qb;
    if (accessibleOrganizationIds.length === 0) return qb.andWhere("1 = 0");
    return qb.andWhere(`(${alias}.organizationId IN (:...accessibleOrganizationIds) OR ${alias}.organizationId IS NULL)`, {
      accessibleOrganizationIds,
    });
  }

  /**
   * Aplica, além da restrição de acesso, os filtros opcionais de organização
   * (exata, não o OR-com-nulo usado na restrição de acesso) e de intervalo de
   * datas sobre a coluna informada (createdAt para solicitações/tickets,
   * approvedAt para o gráfico de competência mensal).
   */
  private applyFilters<T extends { organizationId?: string | null }>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    user: AuthenticatedUser,
    filters: DashboardFilters,
    dateColumn = "createdAt"
  ): SelectQueryBuilder<T> {
    this.restrictToAccessibleOrganizations(qb, alias, user);

    if (filters.organizationId) {
      assertOrganizationAccess(user, filters.organizationId);
      qb.andWhere(`${alias}.organizationId = :filterOrganizationId`, { filterOrganizationId: filters.organizationId });
    }
    if (filters.startDate) {
      qb.andWhere(`${alias}.${dateColumn} >= :startDate`, { startDate: filters.startDate });
    }
    if (filters.endDate) {
      // Fim do dia informado, para incluir todos os registros daquela data.
      qb.andWhere(`${alias}.${dateColumn} <= :endDate`, { endDate: `${filters.endDate} 23:59:59.999` });
    }
    return qb;
  }

  async getCards(user: AuthenticatedUser, filters: DashboardFilters = {}) {
    const prBase = () => this.applyFilters(this.purchaseRequestRepo.createQueryBuilder("pr"), "pr", user, filters);
    // Dashboard é só de Compras — com o Kanban agora genérico (Ticket pode
    // nascer de qualquer Tipo de Solicitação), sem esse filtro os cards
    // passariam a contar tickets de outros departamentos/tipos aqui também.
    // "Pendente"/"Em andamento"/"Resolvido"/"Cancelado" não são mais um enum
    // fixo — são derivados das flags isInitial/isDone/isCancelled da coluna
    // do board em que o ticket está (colunas configuráveis por departamento).
    const tBase = () =>
      this.applyFilters(this.ticketRepo.createQueryBuilder("t"), "t", user, filters)
        .leftJoin("t.column", "bc")
        .andWhere("t.purchaseRequestId IS NOT NULL");

    const [pendingRequests, approvedRequests, rejectedRequests, pendingTickets, inProgressTickets, resolvedTickets, cancelledTickets] =
      await Promise.all([
        prBase().andWhere("pr.status = :status", { status: PurchaseRequestStatus.PENDING_APPROVAL }).getCount(),
        prBase().andWhere("pr.status = :status", { status: PurchaseRequestStatus.APPROVED }).getCount(),
        prBase().andWhere("pr.status = :status", { status: PurchaseRequestStatus.REJECTED }).getCount(),
        tBase().andWhere("bc.isInitial = true").getCount(),
        tBase().andWhere("bc.isInitial = false AND bc.isDone = false AND bc.isCancelled = false").getCount(),
        tBase().andWhere("bc.isDone = true").getCount(),
        tBase().andWhere("bc.isCancelled = true").getCount(),
      ]);

    return {
      pendingRequests, approvedRequests, rejectedRequests,
      pendingTickets, inProgressTickets, resolvedTickets, cancelledTickets,
    };
  }

  /**
   * Soma o valor estimado das solicitações agrupado por status — permite
   * exibir no dashboard quanto está aprovado, reprovado ou ainda em
   * andamento (aguardando aprovação) em termos financeiros, não só em contagem.
   */
  async valueSummary(user: AuthenticatedUser, filters: DashboardFilters = {}) {
    const raw = await this.applyFilters(this.purchaseRequestRepo.createQueryBuilder("pr"), "pr", user, filters)
      .select("pr.status", "status")
      .addSelect("COALESCE(SUM(pr.estimatedValue), 0)", "totalValue")
      .groupBy("pr.status")
      .getRawMany<{ status: PurchaseRequestStatus; totalValue: string }>();

    const byStatus = Object.fromEntries(raw.map((row) => [row.status, Number(row.totalValue)]));

    return {
      approvedValue: byStatus[PurchaseRequestStatus.APPROVED] ?? 0,
      rejectedValue: byStatus[PurchaseRequestStatus.REJECTED] ?? 0,
      pendingApprovalValue: byStatus[PurchaseRequestStatus.PENDING_APPROVAL] ?? 0,
      draftValue: byStatus[PurchaseRequestStatus.DRAFT] ?? 0,
      cancelledValue: byStatus[PurchaseRequestStatus.CANCELLED] ?? 0,
      totalValue: raw.reduce((sum, row) => sum + Number(row.totalValue), 0),
    };
  }

  async requestsByDepartment(user: AuthenticatedUser, filters: DashboardFilters = {}) {
    return this.applyFilters(this.purchaseRequestRepo.createQueryBuilder("pr"), "pr", user, filters)
      .leftJoin("pr.department", "department")
      .select("department.name", "department")
      .addSelect("COUNT(pr.id)", "total")
      .groupBy("department.name")
      .getRawMany();
  }

  /**
   * Compras por mês, pela competência: agrupa pela data de APROVAÇÃO (não de
   * criação da solicitação) e mede em valor monetário (receita/gasto
   * comprometido), não em quantidade — reflete o regime de competência
   * contábil em vez do regime de caixa/criação. Quando nenhum filtro de data
   * é informado, mantém a janela padrão dos últimos 12 meses; se o usuário
   * informar um intervalo, este passa a valer no lugar da janela padrão.
   */
  async purchasesByMonth(user: AuthenticatedUser, filters: DashboardFilters = {}) {
    const qb = this.applyFilters(this.purchaseRequestRepo.createQueryBuilder("pr"), "pr", user, filters, "approvedAt")
      .select("TO_CHAR(pr.approvedAt, 'YYYY-MM')", "month")
      .addSelect("COALESCE(SUM(pr.estimatedValue), 0)", "totalValue")
      .andWhere("pr.status = :status", { status: PurchaseRequestStatus.APPROVED })
      .andWhere("pr.approvedAt IS NOT NULL");

    if (!filters.startDate && !filters.endDate) {
      qb.andWhere("pr.approvedAt >= NOW() - INTERVAL '12 months'");
    }

    return qb.groupBy("month").orderBy("month", "ASC").getRawMany();
  }

  /**
   * History não tem coluna/relação direta de organização — cada entrada é
   * vinculada a um ticket OU a uma solicitação de compra, então a
   * restrição de acesso precisa ser resolvida via join manual (por nome de
   * tabela, já que não há relation mapeada) contra as duas tabelas.
   */
  async recentMovements(user: AuthenticatedUser, limit = 10) {
    const qb = this.historyRepo.createQueryBuilder("h")
      .leftJoin("tickets", "t", "t.id = h.ticket_id")
      .leftJoin("purchase_requests", "pr", "pr.id = h.purchase_request_id")
      // Dashboard é só de Compras — exclui histórico de tickets nascidos de
      // outros tipos de solicitação (sem purchase_request_id).
      .andWhere("(h.ticket_id IS NULL OR t.purchase_request_id IS NOT NULL)");

    const accessibleOrganizationIds = getAccessibleOrganizationIds(user);
    if (accessibleOrganizationIds !== null) {
      if (accessibleOrganizationIds.length === 0) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere(
          `(
            (h.ticket_id IS NOT NULL AND (t.organization_id IN (:...accessibleOrganizationIds) OR t.organization_id IS NULL)) OR
            (h.purchase_request_id IS NOT NULL AND (pr.organization_id IN (:...accessibleOrganizationIds) OR pr.organization_id IS NULL))
          )`,
          { accessibleOrganizationIds }
        );
      }
    }

    return qb.orderBy("h.createdAt", "DESC").take(limit).getMany();
  }

  async recentNotifications(userId: string, limit = 10) {
    return this.notificationRepo.find({ where: { userId }, order: { createdAt: "DESC" }, take: limit });
  }
}

export const dashboardService = new DashboardService();
