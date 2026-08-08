import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import {
  Ticket, TicketStatus, Comment, Follower, Tag, HistoryAction, NotificationType,
  AuditAction, Priority,
} from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { getAccessibleOrganizationIds, assertOrganizationAccess, assertTargetUserOrganizationAccess } from "../../utils/organizationAccess";
import { hasSystemAdminAccess } from "../../utils/permissionAccess";
import { historyService } from "../history/history.service";
import { notificationService } from "../notifications/notification.service";
import { auditService } from "../audit/audit.service";
import { emitBroadcast, SOCKET_EVENTS } from "../../sockets/socket";
import { AuthenticatedUser } from "../../middlewares/types";

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.PENDING]: [TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.PENDING, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  [TicketStatus.RESOLVED]: [TicketStatus.IN_PROGRESS, TicketStatus.PENDING],
  [TicketStatus.CANCELLED]: [TicketStatus.PENDING, TicketStatus.IN_PROGRESS],
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.PENDING]: "Pendente",
  [TicketStatus.IN_PROGRESS]: "Em andamento",
  [TicketStatus.RESOLVED]: "Resolvido",
  [TicketStatus.CANCELLED]: "Cancelado",
};

export class TicketsService {
  private repo = AppDataSource.getRepository(Ticket);
  private commentRepo = AppDataSource.getRepository(Comment);
  private followerRepo = AppDataSource.getRepository(Follower);
  private tagRepo = AppDataSource.getRepository(Tag);

  async list(req: Request, user: AuthenticatedUser) {
    const { page, limit, skip, sortBy, sortOrder, search } = getPaginationParams(req, "createdAt", [
      "protocol", "title", "status", "priority", "createdAt", "archivedAt",
    ]);
    const qb = this.repo.createQueryBuilder("t")
      .leftJoinAndSelect("t.assignee", "assignee")
      .leftJoinAndSelect("t.department", "department")
      .leftJoinAndSelect("t.requester", "requester")
      .leftJoinAndSelect("t.organization", "organization")
      .leftJoinAndSelect("t.purchaseRequest", "purchaseRequest")
      .leftJoinAndSelect("t.requestType", "requestType")
      .loadRelationCountAndMap("t.commentsCount", "t.comments")
      .loadRelationCountAndMap("t.attachmentsCount", "t.attachments");

    const accessibleOrganizationIds = getAccessibleOrganizationIds(user);
    if (accessibleOrganizationIds !== null) {
      if (accessibleOrganizationIds.length === 0) {
        qb.andWhere("1 = 0");
      } else {
        qb.andWhere("(t.organizationId IN (:...accessibleOrganizationIds) OR t.organizationId IS NULL)", { accessibleOrganizationIds });
      }
    }

    if (req.query.status) qb.andWhere("t.status = :status", { status: req.query.status });
    if (req.query.priority) qb.andWhere("t.priority = :priority", { priority: req.query.priority });

    // O Kanban/Arquivados deixou de ser exclusivo de um departamento fixo —
    // por padrão, cada usuário só vê as solicitações destinadas ao PRÓPRIO
    // departamento (independente do tipo de solicitação que as originou).
    // Quem tem acesso irrestrito (admin/SYSTEM_ADMIN) mantém o comportamento
    // de sempre: enxerga tudo por padrão, com filtro opcional por
    // departamento via query param — para os demais, esse filtro é forçado
    // e não pode ser sobrescrito pela query (senão daria pra "espiar" o
    // board de outro departamento só trocando o parâmetro).
    const isPrivileged = await hasSystemAdminAccess(user);
    if (!isPrivileged) {
      qb.andWhere("t.departmentId = :scopedDepartmentId", { scopedDepartmentId: user.departmentId ?? null });
    } else if (req.query.departmentId) {
      qb.andWhere("t.departmentId = :departmentId", { departmentId: req.query.departmentId });
    }

    if (req.query.organizationId) qb.andWhere("t.organizationId = :organizationId", { organizationId: req.query.organizationId });
    if (req.query.requestTypeId) qb.andWhere("t.requestTypeId = :requestTypeId", { requestTypeId: req.query.requestTypeId });
    if (req.query.assigneeId) qb.andWhere("t.assigneeId = :assigneeId", { assigneeId: req.query.assigneeId });
    if (req.query.unassigned === "true") qb.andWhere("t.assigneeId IS NULL");
    // Tickets arquivados ficam ocultos por padrão em qualquer listagem (Kanban,
    // grid, exportação). Só aparecem quando explicitamente solicitados via
    // ?archived=true, usado pela tela dedicada de Arquivados.
    const isArchived = req.query.archived === "true";
    qb.andWhere("t.isArchived = :isArchived", { isArchived });

    // Na tela de Arquivados o período filtra por quando foi arquivado (é a
    // data mostrada ali); nas demais telas, por data de criação do ticket.
    const dateColumn = isArchived ? "archivedAt" : "createdAt";
    if (req.query.startDate) qb.andWhere(`t.${dateColumn} >= :startDate`, { startDate: req.query.startDate });
    if (req.query.endDate) {
      // Fim do dia informado, para incluir todos os registros daquela data.
      qb.andWhere(`t.${dateColumn} <= :endDate`, { endDate: `${req.query.endDate} 23:59:59.999` });
    }
    if (search) {
      qb.andWhere("(t.protocol ILIKE :search OR t.title ILIKE :search)", { search: `%${search}%` });
    }

    const isBoard = req.query.board === "true";
    if (isBoard) {
      // Uma coluna com muito ticket acumulado não pode carregar tudo de uma
      // vez só (uma fila de "Pendente" com milhares de itens já travaria o
      // board inteiro) — cada coluna é paginada por conta própria, com teto
      // configurável via ?columnLimit= (padrão 50, no máx 200). O client usa
      // columnTotals (contagem real por status) pra saber se tem mais item
      // do que o que veio e oferecer "carregar mais".
      const columnLimit = Math.min(Math.max(parseInt(String(req.query.columnLimit ?? "50"), 10) || 50, 1), 200);
      const statuses = Object.values(TicketStatus);
      const perColumn = await Promise.all(
        statuses.map(async (status) => {
          // clone() preserva todos os where/params já aplicados no qb base
          // (organização, departamento, filtros de tela) — cada coluna só
          // adiciona sua própria condição de status por cima.
          const columnBase = qb.clone().andWhere("t.status = :columnStatus", { columnStatus: status });
          const [items, total] = await Promise.all([
            columnBase.clone().leftJoinAndSelect("t.tags", "tags").orderBy("t.createdAt", "DESC").take(columnLimit).getMany(),
            columnBase.getCount(),
          ]);
          return { status, items, total };
        })
      );

      const items = perColumn.flatMap((c) => c.items);
      const columnTotals = Object.fromEntries(perColumn.map((c) => [c.status, c.total]));
      return {
        items,
        meta: { ...buildPaginationMeta(1, items.length || 1, items.length), columnTotals, columnLimit },
      };
    }

    qb.orderBy(`t.${sortBy}`, sortOrder).skip(skip).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async findByIdOrFail(id: string, user?: AuthenticatedUser): Promise<Ticket> {
    const ticket = await this.repo.findOne({
      where: { id },
      relations: [
        "purchaseRequest", "requestType", "requestSubmission", "comments", "comments.author",
        "attachments", "attachments.uploadedBy", "followers", "followers.user", "tags",
      ],
    });
    if (!ticket) throw ApiError.notFound("Ticket não encontrado");
    if (user) {
      assertOrganizationAccess(user, ticket.organizationId);
      await this.assertDepartmentAccess(user, ticket);
    }
    ticket.comments?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    ticket.attachments?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return ticket;
  }

  /**
   * A listagem (list()) já restringe o board/tabela ao departamento do
   * usuário, mas isso sozinho não impede acesso direto pelo ID (ex.: link
   * de notificação, URL colada) a um ticket de outro departamento — abrir o
   * detalhe, comentar, mover etc. dependiam só de permissão global, nunca do
   * departamento do ticket em si. Aqui replicamos a mesma regra em toda
   * operação sobre um ticket específico, mas sem quebrar quem legitimamente
   * precisa acessar um ticket fora do próprio departamento: o solicitante
   * original (ex.: TI abriu uma Compra que hoje "mora" no departamento de
   * Compras) e o responsável atribuído.
   */
  private async assertDepartmentAccess(user: AuthenticatedUser, ticket: Ticket): Promise<void> {
    if (await hasSystemAdminAccess(user)) return;
    if (user.departmentId && ticket.departmentId === user.departmentId) return;
    if (ticket.requesterId === user.id) return;
    if (ticket.assigneeId && ticket.assigneeId === user.id) return;
    throw ApiError.forbidden("Você não tem acesso a tickets de outro departamento");
  }

  /**
   * Ticket arquivado é somente-leitura: sem comentário, atribuição, troca de
   * prioridade/status ou novo anexo. A única ação permitida nesse estado é
   * desarquivar (que não passa por aqui).
   */
  private assertNotArchived(ticket: Ticket): void {
    if (ticket.isArchived) {
      throw ApiError.badRequest("Ticket arquivado não pode ser alterado — desarquive antes de continuar");
    }
  }

  private async getStakeholderIds(ticket: Ticket, excludeUserId?: string): Promise<string[]> {
    const followers = await this.followerRepo.find({ where: { ticketId: ticket.id } });
    const ids = new Set<string>([ticket.requesterId, ...(ticket.assigneeId ? [ticket.assigneeId] : []), ...followers.map((f) => f.userId)]);
    if (excludeUserId) ids.delete(excludeUserId);
    return Array.from(ids);
  }

  async move(user: AuthenticatedUser, id: string, newStatus: TicketStatus, req: Request): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(id, user);
    this.assertNotArchived(ticket);
    const currentStatus = ticket.status;

    if (currentStatus === newStatus) {
      throw ApiError.badRequest("O ticket já se encontra nesta coluna");
    }
    if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
      throw ApiError.badRequest(`Não é possível mover de ${STATUS_LABELS[currentStatus]} para ${STATUS_LABELS[newStatus]}`);
    }
    if (newStatus === TicketStatus.RESOLVED) {
      // Resolver exige permissão específica, validada na rota via authorize adicional no controller
    }

    ticket.status = newStatus;
    await this.repo.save(ticket);

    const isReopening = [TicketStatus.RESOLVED, TicketStatus.CANCELLED].includes(currentStatus);
    const action = isReopening
      ? HistoryAction.REOPENED
      : newStatus === TicketStatus.RESOLVED
        ? HistoryAction.RESOLVED
        : newStatus === TicketStatus.CANCELLED
          ? HistoryAction.CANCELLED
          : HistoryAction.STATUS_CHANGED;

    const description = isReopening
      ? `${user.name} reabriu o ticket, movendo de ${STATUS_LABELS[currentStatus]} para ${STATUS_LABELS[newStatus]}.`
      : `${user.name} moveu o Ticket de ${STATUS_LABELS[currentStatus]} para ${STATUS_LABELS[newStatus]}.`;

    await historyService.record({ ticketId: id, userId: user.id, action, description, metadata: { from: currentStatus, to: newStatus } });
    await auditService.log({ userId: user.id, action: AuditAction.MOVE, entity: "Ticket", entityId: id, req, metadata: { from: currentStatus, to: newStatus } });

    const stakeholders = await this.getStakeholderIds(ticket, user.id);
    const notificationType = newStatus === TicketStatus.RESOLVED
      ? NotificationType.TICKET_RESOLVED
      : newStatus === TicketStatus.CANCELLED
        ? NotificationType.TICKET_CANCELLED
        : isReopening
          ? NotificationType.TICKET_REOPENED
          : NotificationType.TICKET_MOVED;

    await notificationService.notifyMany(stakeholders, {
      type: notificationType,
      title: `Ticket ${ticket.protocol} atualizado`,
      message: description,
      link: `/tickets/${ticket.id}`,
      relatedTicketId: ticket.id,
    });

    emitBroadcast(SOCKET_EVENTS.TICKET_MOVED, { id: ticket.id, from: currentStatus, to: newStatus, protocol: ticket.protocol });
    return this.findByIdOrFail(id, user);
  }

  async assign(user: AuthenticatedUser, id: string, assigneeId: string, req: Request): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(id, user);
    this.assertNotArchived(ticket);
    await assertTargetUserOrganizationAccess(assigneeId, ticket.organizationId);
    const previousAssigneeId = ticket.assigneeId;
    // Usa update() em vez de carregar+mutar+save(): como "assignee" (relação
    // eager) e "assigneeId" (coluna) mapeiam a mesma coluna do banco, salvar
    // a entidade inteira pode fazer o TypeORM reescrever o valor a partir da
    // relação (ainda carregada com o responsável antigo), perdendo a troca.
    await this.repo.update(id, { assigneeId });

    await historyService.record({
      ticketId: id,
      userId: user.id,
      action: HistoryAction.ASSIGNEE_CHANGED,
      description: `${user.name} alterou o responsável do ticket ${ticket.protocol}.`,
      metadata: { from: previousAssigneeId, to: assigneeId },
    });
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req, metadata: { assigneeId } });

    await notificationService.notify({
      userId: assigneeId,
      type: NotificationType.TICKET_MOVED,
      title: `Você foi designado para o ticket ${ticket.protocol}`,
      message: `${user.name} atribuiu o ticket ${ticket.protocol} a você.`,
      link: `/tickets/${ticket.id}`,
      relatedTicketId: ticket.id,
    });

    emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
    return this.findByIdOrFail(id, user);
  }

  async archive(user: AuthenticatedUser, id: string, req: Request): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(id, user);
    if (ticket.isArchived) {
      throw ApiError.conflict("Este ticket já está arquivado");
    }
    if (![TicketStatus.RESOLVED, TicketStatus.CANCELLED].includes(ticket.status)) {
      throw ApiError.badRequest("Só é possível arquivar tickets Resolvidos ou Cancelados");
    }
    const archivedAt = new Date();
    // update() direto: is_archived/archived_at não são relações, mas mantemos
    // o mesmo padrão usado em assign() por segurança e consistência.
    await this.repo.update(id, { isArchived: true, archivedAt });

    await historyService.record({
      ticketId: id,
      userId: user.id,
      action: HistoryAction.ARCHIVED,
      description: `${user.name} arquivou o ticket ${ticket.protocol}.`,
    });
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req, metadata: { archived: true } });

    emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
    return this.findByIdOrFail(id, user);
  }

  async unarchive(user: AuthenticatedUser, id: string, req: Request): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(id, user);
    if (!ticket.isArchived) {
      throw ApiError.conflict("Este ticket não está arquivado");
    }
    await this.repo.update(id, { isArchived: false, archivedAt: null });

    await historyService.record({
      ticketId: id,
      userId: user.id,
      action: HistoryAction.UNARCHIVED,
      description: `${user.name} desarquivou o ticket ${ticket.protocol}.`,
    });
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req, metadata: { archived: false } });

    emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
    return this.findByIdOrFail(id, user);
  }

  async remove(user: AuthenticatedUser, id: string, req: Request): Promise<void> {
    const ticket = await this.findByIdOrFail(id, user);
    // softDelete() gera um UPDATE direto (SET deleted_at = now()), sem carregar
    // e regravar a entidade inteira — mesmo cuidado adotado em assign()/archive().
    await this.repo.softDelete(id);

    await auditService.log({
      userId: user.id,
      action: AuditAction.DELETE,
      entity: "Ticket",
      entityId: id,
      req,
      metadata: { protocol: ticket.protocol, title: ticket.title },
    });

    emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id, deleted: true });
  }

  async changePriority(user: AuthenticatedUser, id: string, priority: Priority, req: Request): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(id, user);
    this.assertNotArchived(ticket);
    const previous = ticket.priority;
    ticket.priority = priority;
    await this.repo.save(ticket);

    await historyService.record({
      ticketId: id,
      userId: user.id,
      action: HistoryAction.PRIORITY_CHANGED,
      description: `${user.name} alterou a prioridade do ticket ${ticket.protocol} de ${previous} para ${priority}.`,
      metadata: { from: previous, to: priority },
    });
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req, metadata: { priority } });

    emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
    return this.findByIdOrFail(id, user);
  }

  async update(user: AuthenticatedUser, id: string, dto: { title?: string; description?: string }, req: Request): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(id, user);
    Object.assign(ticket, dto);
    await this.repo.save(ticket);
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req });
    return this.findByIdOrFail(id, user);
  }

  private async ensureFollower(ticketId: string, userId: string): Promise<boolean> {
    const exists = await this.followerRepo.findOne({ where: { ticketId, userId } });
    if (exists) return false;
    await this.followerRepo.save(this.followerRepo.create({ ticketId, userId }));
    return true;
  }

  async addComment(user: AuthenticatedUser, id: string, content: string, req: Request): Promise<Comment> {
    const ticket = await this.findByIdOrFail(id, user);
    this.assertNotArchived(ticket);

    const comment = await this.commentRepo.save(
      this.commentRepo.create({ ticketId: id, authorId: user.id, content })
    );

    const wasNewFollower = await this.ensureFollower(id, user.id);
    if (wasNewFollower) {
      await historyService.record({
        ticketId: id, userId: user.id, action: HistoryAction.FOLLOWER_ADDED,
        description: `${user.name} passou a acompanhar o ticket ${ticket.protocol}.`,
      });
    }

    await historyService.record({
      ticketId: id, userId: user.id, action: HistoryAction.COMMENTED,
      description: `${user.name} comentou no ticket ${ticket.protocol}.`,
    });

    await auditService.log({ userId: user.id, action: AuditAction.COMMENT, entity: "Ticket", entityId: id, req });

    const stakeholders = await this.getStakeholderIds(ticket, user.id);
    await notificationService.notifyMany(stakeholders, {
      type: NotificationType.NEW_COMMENT,
      title: `Novo comentário no ticket ${ticket.protocol}`,
      message: `${user.name}: ${content.slice(0, 140)}`,
      link: `/tickets/${ticket.id}`,
      relatedTicketId: ticket.id,
    });

    emitBroadcast(SOCKET_EVENTS.TICKET_COMMENTED, { id: ticket.id });
    return comment;
  }

  async addFollower(user: AuthenticatedUser, id: string, userId: string, req: Request): Promise<void> {
    const ticket = await this.findByIdOrFail(id, user);
    this.assertNotArchived(ticket);
    await assertTargetUserOrganizationAccess(userId, ticket.organizationId);
    const added = await this.ensureFollower(id, userId);
    if (!added) throw ApiError.conflict("Usuário já é acompanhante deste ticket");

    await historyService.record({
      ticketId: id, userId: user.id, action: HistoryAction.FOLLOWER_ADDED,
      description: `${user.name} adicionou um novo acompanhante ao ticket ${ticket.protocol}.`,
    });
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req, metadata: { followerAdded: userId } });

    await notificationService.notify({
      userId,
      type: NotificationType.NEW_FOLLOWER,
      title: `Você agora acompanha o ticket ${ticket.protocol}`,
      message: `${user.name} adicionou você como acompanhante do ticket ${ticket.protocol}.`,
      link: `/tickets/${ticket.id}`,
      relatedTicketId: ticket.id,
    });
  }

  async removeFollower(actingUser: AuthenticatedUser, id: string, userId: string, req: Request): Promise<void> {
    const ticket = await this.findByIdOrFail(id, actingUser);
    this.assertNotArchived(ticket);
    const existing = await this.followerRepo.findOne({ where: { ticketId: id, userId } });
    if (!existing) return;

    await this.followerRepo.delete({ ticketId: id, userId });

    const isSelfRemoval = actingUser.id === userId;
    const description = isSelfRemoval
      ? `${actingUser.name} deixou de acompanhar o ticket ${ticket.protocol}.`
      : `${actingUser.name} removeu ${existing.user?.name ?? "um usuário"} dos acompanhantes do ticket ${ticket.protocol}.`;

    await historyService.record({
      ticketId: id,
      userId: actingUser.id,
      action: HistoryAction.FOLLOWER_REMOVED,
      description,
    });
    await auditService.log({ userId: actingUser.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req, metadata: { followerRemoved: userId } });

    emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
  }

  async addTag(user: AuthenticatedUser, id: string, tagId: string, req: Request): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(id, user);
    this.assertNotArchived(ticket);
    const tag = await this.tagRepo.findOne({ where: { id: tagId } });
    if (!tag) throw ApiError.notFound("Etiqueta não encontrada");
    if (ticket.tags.some((t) => t.id === tagId)) {
      throw ApiError.conflict("Ticket já possui esta etiqueta");
    }

    ticket.tags = [...ticket.tags, tag];
    await this.repo.save(ticket);

    await historyService.record({
      ticketId: id, userId: user.id, action: HistoryAction.TAG_ADDED,
      description: `${user.name} adicionou a etiqueta "${tag.name}" ao ticket ${ticket.protocol}.`,
    });
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req, metadata: { tagAdded: tagId } });

    emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
    return this.findByIdOrFail(id, user);
  }

  async removeTag(user: AuthenticatedUser, id: string, tagId: string, req: Request): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(id, user);
    this.assertNotArchived(ticket);
    const tag = ticket.tags.find((t) => t.id === tagId);
    if (!tag) throw ApiError.notFound("Ticket não possui esta etiqueta");

    ticket.tags = ticket.tags.filter((t) => t.id !== tagId);
    await this.repo.save(ticket);

    await historyService.record({
      ticketId: id, userId: user.id, action: HistoryAction.TAG_REMOVED,
      description: `${user.name} removeu a etiqueta "${tag.name}" do ticket ${ticket.protocol}.`,
    });
    await auditService.log({ userId: user.id, action: AuditAction.UPDATE, entity: "Ticket", entityId: id, req, metadata: { tagRemoved: tagId } });

    emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
    return this.findByIdOrFail(id, user);
  }
}

export const ticketsService = new TicketsService();
