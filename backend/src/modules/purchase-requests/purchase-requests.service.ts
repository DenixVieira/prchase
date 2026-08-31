import { AppDataSource } from "../../config/data-source";
import {
  PurchaseRequest, PurchaseRequestStatus, PurchaseApproval, ApprovalDecision,
  Ticket, HistoryAction, NotificationType, AuditAction, Department,
  DepartmentPermission, PermissionKey, User,
} from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { generateSequentialNumber } from "../../utils/protocol";
import { getAccessibleOrganizationIds, assertOrganizationAccess } from "../../utils/organizationAccess";
import { historyService } from "../history/history.service";
import { notificationService } from "../notifications/notification.service";
import { auditService } from "../audit/audit.service";
import { emitBroadcast, SOCKET_EVENTS } from "../../sockets/socket";
import { Request } from "express";
import { AuthenticatedUser } from "../../middlewares/types";
import { boardsService } from "../boards/boards.service";

export class PurchaseRequestsService {
  private repo = AppDataSource.getRepository(PurchaseRequest);
  private departmentRepo = AppDataSource.getRepository(Department);
  private deptPermRepo = AppDataSource.getRepository(DepartmentPermission);
  private userRepo = AppDataSource.getRepository(User);

  /**
   * Retorna os IDs dos usuários ativos que pertencem a departamentos com a
   * permissão de aprovar solicitações, excluindo o próprio departamento do
   * solicitante (a aprovação é sempre feita por outro departamento).
   */
  private async findApproverUserIds(excludeDepartmentId: string): Promise<string[]> {
    const grants = await this.deptPermRepo.find({
      where: { granted: true },
      relations: ["permission"],
    });
    const approverDepartmentIds = Array.from(
      new Set(
        grants
          .filter((g) => g.permission.key === PermissionKey.APPROVE_PURCHASE_REQUEST || g.permission.key === PermissionKey.SYSTEM_ADMIN)
          .map((g) => g.departmentId)
          .filter((departmentId) => departmentId !== excludeDepartmentId)
      )
    );
    if (approverDepartmentIds.length === 0) return [];
    const approvers = await this.userRepo
      .createQueryBuilder("user")
      .where("user.departmentId IN (:...departmentIds)", { departmentIds: approverDepartmentIds })
      .andWhere("user.isActive = true")
      .getMany();
    return approvers.map((u) => u.id);
  }

  async create(user: AuthenticatedUser, dto: {
    organizationId: string; costCenter: string; supplier: string; category: string;
    description: string; justification: string; estimatedValue: number;
    priority: string; observations?: string;
  }, req: Request) {
    // O departamento da solicitação é sempre o do próprio solicitante — nunca
    // aceito do corpo da requisição, pra não dar pra um usuário abrir uma
    // solicitação "em nome" de outro departamento.
    if (!user.departmentId) {
      throw ApiError.badRequest("Você precisa estar vinculado a um departamento para criar uma solicitação de compra");
    }
    // A organização, por outro lado, é escolhida manualmente pelo usuário —
    // mas só entre as organizações que o departamento dele pode acessar.
    assertOrganizationAccess(user, dto.organizationId);

    const number = await generateSequentialNumber(AppDataSource, "purchase_requests", "CP");
    const purchaseRequest = await this.repo.save(
      this.repo.create({
        number,
        departmentId: user.departmentId,
        organizationId: dto.organizationId,
        requesterId: user.id,
        costCenter: dto.costCenter,
        supplier: dto.supplier,
        category: dto.category,
        description: dto.description,
        justification: dto.justification,
        estimatedValue: String(dto.estimatedValue),
        priority: dto.priority as never,
        observations: dto.observations ?? null,
        status: PurchaseRequestStatus.DRAFT,
      })
    );

    await historyService.record({
      purchaseRequestId: purchaseRequest.id,
      userId: user.id,
      action: HistoryAction.CREATED,
      description: `${user.name} criou a solicitação ${number} em rascunho.`,
    });

    await auditService.log({ userId: user.id, action: AuditAction.CREATE, entity: "PurchaseRequest", entityId: purchaseRequest.id, req });

    return this.findByIdOrFail(purchaseRequest.id, user);
  }

  async update(user: AuthenticatedUser, id: string, dto: Record<string, unknown>, req: Request) {
    const purchaseRequest = await this.findByIdOrFail(id, user);
    if (purchaseRequest.status !== PurchaseRequestStatus.DRAFT) {
      throw ApiError.badRequest("Somente solicitações em rascunho podem ser editadas");
    }
    if (purchaseRequest.requesterId !== user.id && !user.isAdmin) {
      throw ApiError.forbidden("Você só pode editar suas próprias solicitações");
    }

    if (dto.estimatedValue !== undefined) dto.estimatedValue = String(dto.estimatedValue);
    Object.assign(purchaseRequest, dto);
    await this.repo.save(purchaseRequest);

    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "PurchaseRequest", entityId: id, req });
    return this.findByIdOrFail(id, user);
  }

  async submit(user: AuthenticatedUser, id: string, req: Request) {
    const purchaseRequest = await this.findByIdOrFail(id, user);
    if (purchaseRequest.status !== PurchaseRequestStatus.DRAFT) {
      throw ApiError.badRequest("Somente solicitações em rascunho podem ser enviadas para aprovação");
    }
    if (purchaseRequest.requesterId !== user.id && !user.isAdmin) {
      throw ApiError.forbidden("Você só pode enviar suas próprias solicitações");
    }

    purchaseRequest.status = PurchaseRequestStatus.PENDING_APPROVAL;
    await this.repo.save(purchaseRequest);

    await historyService.record({
      purchaseRequestId: id,
      userId: user.id,
      action: HistoryAction.SUBMITTED_FOR_APPROVAL,
      description: `${user.name} enviou a solicitação ${purchaseRequest.number} para aprovação.`,
    });

    await auditService.log({ userId: user.id, action: AuditAction.STATUS_CHANGE, entity: "PurchaseRequest", entityId: id, req, metadata: { status: purchaseRequest.status } });

    const approverIds = await this.findApproverUserIds(purchaseRequest.departmentId);
    await notificationService.notifyMany(approverIds, {
      type: NotificationType.REQUEST_PENDING_APPROVAL,
      title: `Solicitação ${purchaseRequest.number} aguardando aprovação`,
      message: `${user.name} enviou a solicitação ${purchaseRequest.number} (${purchaseRequest.supplier}) para aprovação.`,
      link: `/purchase-requests/${purchaseRequest.id}`,
      relatedPurchaseRequestId: purchaseRequest.id,
    });

    emitBroadcast(SOCKET_EVENTS.PURCHASE_REQUEST_UPDATED, { id, status: purchaseRequest.status });
    return this.findByIdOrFail(id, user);
  }

  async cancel(user: AuthenticatedUser, id: string, req: Request) {
    const purchaseRequest = await this.findByIdOrFail(id, user);
    if (![PurchaseRequestStatus.DRAFT, PurchaseRequestStatus.PENDING_APPROVAL].includes(purchaseRequest.status)) {
      throw ApiError.badRequest("Esta solicitação não pode mais ser cancelada");
    }
    if (purchaseRequest.requesterId !== user.id && !user.isAdmin) {
      throw ApiError.forbidden("Você só pode cancelar suas próprias solicitações");
    }

    purchaseRequest.status = PurchaseRequestStatus.CANCELLED;
    await this.repo.save(purchaseRequest);

    await historyService.record({
      purchaseRequestId: id,
      userId: user.id,
      action: HistoryAction.CANCELLED,
      description: `${user.name} cancelou a solicitação ${purchaseRequest.number}.`,
    });

    await auditService.log({ userId: user.id, action: AuditAction.STATUS_CHANGE, entity: "PurchaseRequest", entityId: id, req, metadata: { status: purchaseRequest.status } });
    emitBroadcast(SOCKET_EVENTS.PURCHASE_REQUEST_UPDATED, { id, status: purchaseRequest.status });
    return this.findByIdOrFail(id, user);
  }

  async approve(user: AuthenticatedUser, id: string, reason: string | undefined, req: Request) {
    const purchaseRequest = await this.findByIdOrFail(id, user);
    if (purchaseRequest.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw ApiError.badRequest("Somente solicitações aguardando aprovação podem ser aprovadas");
    }
    if (!user.departmentId) {
      throw ApiError.forbidden("Usuário sem departamento não pode aprovar solicitações");
    }
    if (user.departmentId === purchaseRequest.departmentId && !user.isAdmin) {
      throw ApiError.forbidden("A aprovação deve ser realizada por um departamento diferente do solicitante");
    }

    // Descobre o departamento aprovador e reserva o protocolo do ticket ANTES
    // de abrir a transação (são só leituras, não precisam ser revertidas).
    const approverDepartment = await this.departmentRepo.findOneOrFail({ where: { id: user.departmentId } });
    const protocol = await generateSequentialNumber(AppDataSource, "tickets", "TK");
    const initialColumn = await boardsService.getInitialColumn(approverDepartment.id);

    // Todo o estado de negócio (status da solicitação + registro de
    // aprovação + criação do ticket) é gravado em uma ÚNICA transação: se a
    // criação do ticket falhar por qualquer motivo (ex.: coluna nova ainda
    // sem migration aplicada), a mudança de status também é revertida — a
    // solicitação volta a PENDING_APPROVAL automaticamente, em vez de ficar
    // presa como "aprovada" para sempre sem nenhum ticket correspondente.
    const ticket = await AppDataSource.transaction(async (manager) => {
      purchaseRequest.status = PurchaseRequestStatus.APPROVED;
      purchaseRequest.approvedAt = new Date();
      await manager.save(purchaseRequest);

      await manager.save(
        manager.create(PurchaseApproval, {
          purchaseRequestId: id,
          approverId: user.id,
          approverDepartmentId: user.departmentId!,
          decision: ApprovalDecision.APPROVED,
          reason: reason ?? null,
        })
      );

      return manager.save(
        manager.create(Ticket, {
          protocol,
          title: `Compra: ${purchaseRequest.category} — ${purchaseRequest.supplier}`,
          description: purchaseRequest.description,
          purchaseRequestId: purchaseRequest.id,
          columnId: initialColumn.id,
          priority: purchaseRequest.priority,
          departmentId: approverDepartment.id,
          organizationId: purchaseRequest.organizationId ?? null,
          requesterId: purchaseRequest.requesterId,
        })
      );
    });

    await historyService.record({
      purchaseRequestId: id,
      userId: user.id,
      action: HistoryAction.APPROVED,
      description: `${user.name} aprovou a solicitação ${purchaseRequest.number}.`,
    });

    await historyService.record({
      ticketId: ticket.id,
      userId: user.id,
      action: HistoryAction.CREATED,
      description: `Ticket ${protocol} criado automaticamente a partir da solicitação ${purchaseRequest.number} aprovada.`,
    });

    await auditService.log({ userId: user.id, action: AuditAction.STATUS_CHANGE, entity: "PurchaseRequest", entityId: id, req, metadata: { status: purchaseRequest.status } });

    await notificationService.notify({
      userId: purchaseRequest.requesterId,
      type: NotificationType.REQUEST_APPROVED,
      title: "Solicitação de compra aprovada",
      message: `Sua solicitação ${purchaseRequest.number} foi aprovada e o ticket ${protocol} foi criado no Kanban de Compras.`,
      link: `/tickets/${ticket.id}`,
      relatedPurchaseRequestId: purchaseRequest.id,
      relatedTicketId: ticket.id,
    });

    emitBroadcast(SOCKET_EVENTS.PURCHASE_REQUEST_UPDATED, { id, status: purchaseRequest.status });
    emitBroadcast(SOCKET_EVENTS.TICKET_CREATED, { id: ticket.id, protocol: ticket.protocol });

    return { purchaseRequest: await this.findByIdOrFail(id, user), ticket };
  }

  async reject(user: AuthenticatedUser, id: string, reason: string, req: Request) {
    const purchaseRequest = await this.findByIdOrFail(id, user);
    if (purchaseRequest.status !== PurchaseRequestStatus.PENDING_APPROVAL) {
      throw ApiError.badRequest("Somente solicitações aguardando aprovação podem ser reprovadas");
    }
    if (!user.departmentId) {
      throw ApiError.forbidden("Usuário sem departamento não pode reprovar solicitações");
    }

    await AppDataSource.transaction(async (manager) => {
      purchaseRequest.status = PurchaseRequestStatus.REJECTED;
      await manager.save(purchaseRequest);

      await manager.save(
        manager.create(PurchaseApproval, {
          purchaseRequestId: id,
          approverId: user.id,
          approverDepartmentId: user.departmentId!,
          decision: ApprovalDecision.REJECTED,
          reason,
        })
      );
    });

    await historyService.record({
      purchaseRequestId: id,
      userId: user.id,
      action: HistoryAction.REJECTED,
      description: `${user.name} reprovou a solicitação ${purchaseRequest.number}. Motivo: ${reason}`,
    });

    await auditService.log({ userId: user.id, action: AuditAction.STATUS_CHANGE, entity: "PurchaseRequest", entityId: id, req, metadata: { status: purchaseRequest.status, reason } });

    await notificationService.notify({
      userId: purchaseRequest.requesterId,
      type: NotificationType.REQUEST_REJECTED,
      title: "Solicitação de compra reprovada",
      message: `Sua solicitação ${purchaseRequest.number} foi reprovada. Motivo: ${reason}`,
      link: `/purchase-requests/${purchaseRequest.id}`,
      relatedPurchaseRequestId: purchaseRequest.id,
    });

    emitBroadcast(SOCKET_EVENTS.PURCHASE_REQUEST_UPDATED, { id, status: purchaseRequest.status });
    return this.findByIdOrFail(id, user);
  }

  async findByIdOrFail(id: string, user?: AuthenticatedUser): Promise<PurchaseRequest> {
    const purchaseRequest = await this.repo.findOne({
      where: { id },
      relations: ["approvals"],
    });
    if (!purchaseRequest) throw ApiError.notFound("Solicitação de compra não encontrada");
    if (user) assertOrganizationAccess(user, purchaseRequest.organizationId);
    return purchaseRequest;
  }

  async list(user: AuthenticatedUser, req: Request) {
    const { page, limit, skip, sortBy, sortOrder, search } = getPaginationParams(req, "createdAt", [
      "number", "supplier", "category", "estimatedValue", "priority", "status", "createdAt",
    ]);
    const qb = this.repo.createQueryBuilder("pr")
      .leftJoinAndSelect("pr.department", "department")
      .leftJoinAndSelect("pr.requester", "requester")
      .leftJoinAndSelect("requester.department", "requesterDepartment")
      .leftJoinAndSelect("pr.organization", "organization");

    const accessibleOrganizationIds = getAccessibleOrganizationIds(user);
    if (accessibleOrganizationIds !== null) {
      if (accessibleOrganizationIds.length === 0) {
        qb.andWhere("1 = 0"); // departamento sem nenhuma organização configurada: não enxerga nada
      } else {
        qb.andWhere("(pr.organizationId IN (:...accessibleOrganizationIds) OR pr.organizationId IS NULL)", { accessibleOrganizationIds });
      }
    }

    if (req.query.status) qb.andWhere("pr.status = :status", { status: req.query.status });
    if (req.query.departmentId) qb.andWhere("pr.departmentId = :departmentId", { departmentId: req.query.departmentId });
    if (req.query.organizationId) qb.andWhere("pr.organizationId = :organizationId", { organizationId: req.query.organizationId });
    if (req.query.priority) qb.andWhere("pr.priority = :priority", { priority: req.query.priority });
    if (req.query.mine === "true") qb.andWhere("pr.requesterId = :userId", { userId: user.id });
    if (req.query.startDate) qb.andWhere("pr.createdAt >= :startDate", { startDate: req.query.startDate });
    if (req.query.endDate) {
      // Fim do dia informado, para incluir todos os registros daquela data.
      qb.andWhere("pr.createdAt <= :endDate", { endDate: `${req.query.endDate} 23:59:59.999` });
    }
    if (search) {
      qb.andWhere("(pr.number ILIKE :search OR pr.description ILIKE :search OR pr.supplier ILIKE :search)", {
        search: `%${search}%`,
      });
    }

    qb.orderBy(`pr.${sortBy}`, sortOrder).skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}

export const purchaseRequestsService = new PurchaseRequestsService();
