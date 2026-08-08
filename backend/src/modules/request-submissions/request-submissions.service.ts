import fs from "fs";
import path from "path";
import { Request } from "express";
import { AppDataSource } from "../../config/data-source";
import { logger } from "../../config/logger";
import {
  RequestType, RequestTypeSourceKind, RequestField, RequestFieldType, RequestSubmission,
  Ticket, TicketStatus, Priority, Attachment, HistoryAction, NotificationType, AuditAction,
} from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { generateSequentialNumber } from "../../utils/protocol";
import { assertOrganizationAccess } from "../../utils/organizationAccess";
import { hasSystemAdminAccess } from "../../utils/permissionAccess";
import { buildSafeAttachmentFileName } from "../../middlewares/upload";
import { verifyFileSignatureBuffer } from "../../utils/fileSignature";
import { historyService } from "../history/history.service";
import { notificationService } from "../notifications/notification.service";
import { auditService } from "../audit/audit.service";
import { emitBroadcast, SOCKET_EVENTS } from "../../sockets/socket";
import { AuthenticatedUser } from "../../middlewares/types";
import { ticketsService } from "../tickets/tickets.service";

interface PendingAttachment {
  fieldKey: string;
  fieldLabel: string;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
  physicalName: string;
  absolutePath: string;
}

export class RequestSubmissionsService {
  private requestTypeRepo = AppDataSource.getRepository(RequestType);

  async create(
    user: AuthenticatedUser,
    requestTypeId: string,
    organizationId: string,
    rawData: Record<string, unknown>,
    files: Express.Multer.File[],
    req: Request
  ): Promise<Ticket> {
    const requestType = await this.requestTypeRepo.findOne({ where: { id: requestTypeId }, relations: ["fields", "organizations", "visibleDepartments"] });
    if (!requestType) throw ApiError.notFound("Tipo de solicitação não encontrado");
    if (!requestType.isActive) throw ApiError.badRequest("Este tipo de solicitação não está mais disponível");
    if (requestType.sourceKind !== RequestTypeSourceKind.DYNAMIC || !requestType.departmentId) {
      throw ApiError.badRequest("Este tipo de solicitação não aceita envio por aqui");
    }
    // Restrição extra e opcional por departamento (além da organização,
    // checada logo abaixo) — checagem autoritativa: repete no servidor o que
    // a listagem/tela já deveriam ter impedido de chegar aqui. Admin/
    // SYSTEM_ADMIN ignora essa restrição, mesmo bypass usado na visibilidade
    // (request-types.service.ts).
    const allowedDepartmentIds = (requestType.visibleDepartments ?? []).map((d) => d.id);
    if (allowedDepartmentIds.length > 0 && !allowedDepartmentIds.includes(user.departmentId ?? "") && !(await hasSystemAdminAccess(user))) {
      throw ApiError.badRequest("Este tipo de solicitação não está disponível para o seu departamento");
    }
    if (!organizationId) throw ApiError.badRequest("Selecione a organização");
    // Mesma regra da Solicitação de Compra: só pode escolher entre as
    // organizações que o próprio departamento do usuário tem acesso...
    assertOrganizationAccess(user, organizationId);
    // ...E a organização escolhida precisa estar entre as que o admin marcou
    // pra este tipo (fica vazio = tipo ainda indisponível pra todo mundo).
    const allowedOrganizationIds = new Set((requestType.organizations ?? []).map((o) => o.id));
    if (!allowedOrganizationIds.has(organizationId)) {
      throw ApiError.badRequest("Este tipo de solicitação não está disponível para a organização selecionada");
    }

    const fields = [...requestType.fields].sort((a, b) => a.order - b.order);
    const { values, summaryLines, pendingAttachments } = this.validateAndBuildValues(fields, rawData, files);

    // Confere a assinatura binária de cada anexo ANTES de reservar protocolo/
    // abrir transação — mesma checagem que uploadAttachment faz depois de já
    // ter escrito em disco (aqui dá pra checar direto no buffer em memória).
    for (const pending of pendingAttachments) {
      if (!verifyFileSignatureBuffer(pending.buffer, pending.mimeType)) {
        throw ApiError.badRequest(`O conteúdo do arquivo enviado em "${pending.fieldLabel}" não corresponde ao tipo informado`);
      }
    }

    const protocol = await generateSequentialNumber(AppDataSource, "tickets", "TK");
    const now = new Date();
    const uploadDir = path.join(process.cwd(), env.uploadsDir, "anexos tickets", String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"), protocol);

    // Nome/caminho físico definitivo é decidido AGORA (determinístico, sem
    // tocar disco) — a escrita de fato só acontece depois do commit, ver
    // comentário no fim do método.
    for (const pending of pendingAttachments) {
      pending.physicalName = buildSafeAttachmentFileName(pending.originalName);
      pending.absolutePath = path.join(uploadDir, pending.physicalName);
    }

    const title = requestType.name;
    const description = summaryLines.length > 0 ? summaryLines.join("\n") : requestType.name;

    const { submission, ticket } = await AppDataSource.transaction(async (manager) => {
      const submission = await manager.save(
        manager.create(RequestSubmission, {
          requestTypeId: requestType.id,
          requesterId: user.id,
          departmentId: requestType.departmentId!,
          organizationId,
          data: values,
        })
      );

      const ticket = await manager.save(
        manager.create(Ticket, {
          protocol,
          title,
          description,
          requestTypeId: requestType.id,
          requestSubmissionId: submission.id,
          status: TicketStatus.PENDING,
          priority: Priority.MEDIUM,
          departmentId: requestType.departmentId!,
          organizationId,
          requesterId: user.id,
        })
      );

      if (pendingAttachments.length > 0) {
        await manager.save(
          Attachment,
          pendingAttachments.map((pending) =>
            manager.create(Attachment, {
              ticketId: ticket.id,
              originalName: pending.originalName,
              physicalName: pending.physicalName,
              path: pending.absolutePath,
              mimeType: pending.mimeType,
              size: pending.size,
              uploadedById: user.id,
              sourceFieldKey: pending.fieldKey,
            })
          )
        );
      }

      return { submission, ticket };
    });

    await historyService.record({
      ticketId: ticket.id,
      userId: user.id,
      action: HistoryAction.CREATED,
      description: `${user.name} enviou a solicitação "${requestType.name}", criando o ticket ${protocol}.`,
    });

    await auditService.log({ userId: user.id, action: AuditAction.CREATE, entity: "RequestSubmission", entityId: submission.id, req, metadata: { ticketId: ticket.id, requestTypeId: requestType.id } });

    if (requestType.department?.responsibleUserId) {
      await notificationService.notify({
        userId: requestType.department.responsibleUserId,
        type: NotificationType.NEW_TICKET,
        title: `Nova solicitação: ${requestType.name}`,
        message: `${user.name} abriu o ticket ${protocol} (${requestType.name}).`,
        link: `/tickets/${ticket.id}`,
        relatedTicketId: ticket.id,
      });
    }

    emitBroadcast(SOCKET_EVENTS.TICKET_CREATED, { id: ticket.id, protocol: ticket.protocol });

    // Só grava em disco depois que tudo acima já está commitado — se isso
    // falhar, a submission/ticket permanecem válidos (mesmo trade-off já
    // aceito em purchaseRequestsService.approve() pro protocolo do ticket);
    // o usuário reenvia o anexo pelo próprio ticket (AttachmentsCard).
    if (pendingAttachments.length > 0) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        for (const pending of pendingAttachments) {
          fs.writeFileSync(pending.absolutePath, pending.buffer);
        }
      } catch (error) {
        logger.error({ error, ticketId: ticket.id, protocol: ticket.protocol }, "Falha ao gravar anexo(s) do ticket em disco");
      }
    }

    // Reconsulta com as relações completas (assignee/department/requester/
    // etc.) — o "ticket" retornado da transação só tem garantido os valores
    // que passamos em create(), não o grafo de relações que a tela de
    // detalhe espera.
    return ticketsService.findByIdOrFail(ticket.id, user);
  }

  private validateAndBuildValues(
    fields: RequestField[],
    rawData: Record<string, unknown>,
    files: Express.Multer.File[]
  ): { values: Record<string, unknown>; summaryLines: string[]; pendingAttachments: PendingAttachment[] } {
    const values: Record<string, unknown> = {};
    const summaryLines: string[] = [];
    const pendingAttachments: PendingAttachment[] = [];

    for (const field of fields) {
      if (field.type === RequestFieldType.FILE) {
        const file = files.find((f) => f.fieldname === field.key);
        if (field.required && !file) throw ApiError.badRequest(`O campo "${field.label}" é obrigatório`);
        if (file) {
          pendingAttachments.push({
            fieldKey: field.key,
            fieldLabel: field.label,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            buffer: file.buffer,
            physicalName: "",
            absolutePath: "",
          });
          summaryLines.push(`${field.label}: ${file.originalname}`);
        }
        continue;
      }

      const raw = rawData ? rawData[field.key] : undefined;
      const isEmpty = raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0);
      if (field.required && isEmpty) throw ApiError.badRequest(`O campo "${field.label}" é obrigatório`);
      if (isEmpty) continue;

      switch (field.type) {
        case RequestFieldType.TEXT:
        case RequestFieldType.TEXTAREA: {
          if (typeof raw !== "string") throw ApiError.badRequest(`O campo "${field.label}" deve ser texto`);
          values[field.key] = raw;
          summaryLines.push(`${field.label}: ${raw}`);
          break;
        }
        case RequestFieldType.NUMBER: {
          const num = Number(raw);
          // isFinite (não só isNaN) — "Infinity"/"-Infinity" também passam por
          // Number() sem virar NaN, e JSON.stringify os transformaria em
          // `null` silenciosamente ao gravar no jsonb.
          if (!Number.isFinite(num)) throw ApiError.badRequest(`O campo "${field.label}" deve ser numérico`);
          values[field.key] = num;
          summaryLines.push(`${field.label}: ${num}`);
          break;
        }
        case RequestFieldType.DATE: {
          if (typeof raw !== "string" || Number.isNaN(Date.parse(raw))) {
            throw ApiError.badRequest(`O campo "${field.label}" deve ser uma data válida`);
          }
          values[field.key] = raw;
          summaryLines.push(`${field.label}: ${raw}`);
          break;
        }
        case RequestFieldType.CHECKBOX: {
          values[field.key] = Boolean(raw);
          summaryLines.push(`${field.label}: ${raw ? "Sim" : "Não"}`);
          break;
        }
        case RequestFieldType.SELECT: {
          const optionValues = new Set((field.options ?? []).map((o) => o.value));
          if (typeof raw !== "string" || !optionValues.has(raw)) {
            throw ApiError.badRequest(`Valor inválido para o campo "${field.label}"`);
          }
          values[field.key] = raw;
          const optionLabel = field.options?.find((o) => o.value === raw)?.label ?? raw;
          summaryLines.push(`${field.label}: ${optionLabel}`);
          break;
        }
        case RequestFieldType.MULTISELECT: {
          const optionValues = new Set((field.options ?? []).map((o) => o.value));
          const arr = Array.isArray(raw) ? raw : [raw];
          if (!arr.every((v) => typeof v === "string" && optionValues.has(v))) {
            throw ApiError.badRequest(`Valor inválido para o campo "${field.label}"`);
          }
          values[field.key] = arr;
          const labels = arr.map((v) => field.options?.find((o) => o.value === v)?.label ?? v).join(", ");
          summaryLines.push(`${field.label}: ${labels}`);
          break;
        }
      }
    }

    return { values, summaryLines, pendingAttachments };
  }
}

export const requestSubmissionsService = new RequestSubmissionsService();
