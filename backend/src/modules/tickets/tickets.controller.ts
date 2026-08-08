import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ticketsService } from "./tickets.service";
import { historyService } from "../history/history.service";
import { notificationService } from "../notifications/notification.service";
import { auditService } from "../audit/audit.service";
import { AppDataSource } from "../../config/data-source";
import { Attachment, HistoryAction, AuditAction, NotificationType } from "../../database/entities";
import { emitBroadcast, SOCKET_EVENTS } from "../../sockets/socket";
import { ApiError } from "../../utils/ApiError";
import { verifyFileSignature } from "../../utils/fileSignature";

const attachmentRepo = AppDataSource.getRepository(Attachment);

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await ticketsService.list(req, req.user!);
  sendSuccess(res, items, 200, meta);
});

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.findByIdOrFail(req.params.id, req.user!);
  sendSuccess(res, result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.update(req.user!, req.params.id, req.body, req);
  sendSuccess(res, result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await ticketsService.remove(req.user!, req.params.id, req);
  sendSuccess(res, { message: "Ticket excluído" });
});

export const move = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.move(req.user!, req.params.id, req.body.status, req);
  sendSuccess(res, result);
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.assign(req.user!, req.params.id, req.body.assigneeId, req);
  sendSuccess(res, result);
});

export const changePriority = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.changePriority(req.user!, req.params.id, req.body.priority, req);
  sendSuccess(res, result);
});

export const archive = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.archive(req.user!, req.params.id, req);
  sendSuccess(res, result);
});

export const unarchive = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.unarchive(req.user!, req.params.id, req);
  sendSuccess(res, result);
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketsService.findByIdOrFail(req.params.id, req.user!);
  sendSuccess(res, ticket.comments);
});

export const addComment = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.addComment(req.user!, req.params.id, req.body.content, req);
  sendSuccess(res, result, 201);
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await historyService.listByTicket(req.params.id);
  sendSuccess(res, result);
});

export const addFollower = asyncHandler(async (req: Request, res: Response) => {
  await ticketsService.addFollower(req.user!, req.params.id, req.body.userId, req);
  sendSuccess(res, { message: "Acompanhante adicionado" }, 201);
});

export const removeFollower = asyncHandler(async (req: Request, res: Response) => {
  await ticketsService.removeFollower(req.user!, req.params.id, req.params.userId, req);
  sendSuccess(res, { message: "Acompanhante removido" });
});

export const addTag = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.addTag(req.user!, req.params.id, req.body.tagId, req);
  sendSuccess(res, result, 201);
});

export const removeTag = asyncHandler(async (req: Request, res: Response) => {
  const result = await ticketsService.removeTag(req.user!, req.params.id, req.params.tagId, req);
  sendSuccess(res, result);
});

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Nenhum arquivo enviado");
  // O Content-Type do multer vem do navegador e é trivial de falsificar
  // (ex.: renomear um .exe pra "nota.pdf") — confere os magic bytes reais.
  if (!(await verifyFileSignature(req.file.path, req.file.mimetype))) {
    fs.unlinkSync(req.file.path);
    throw ApiError.badRequest("O conteúdo do arquivo não corresponde ao tipo informado");
  }
  const ticket = await ticketsService.findByIdOrFail(req.params.ticketId, req.user!);

  const attachment = await attachmentRepo.save(
    attachmentRepo.create({
      ticketId: req.params.ticketId,
      originalName: req.file.originalname,
      physicalName: req.file.filename,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedById: req.user!.id,
    })
  );

  await historyService.record({
    ticketId: req.params.ticketId,
    userId: req.user!.id,
    action: HistoryAction.ATTACHMENT_ADDED,
    description: `${req.user!.name} anexou o arquivo ${req.file.originalname}.`,
  });

  await auditService.log({ userId: req.user!.id, action: AuditAction.UPLOAD, entity: "Ticket", entityId: req.params.ticketId, req });

  const stakeholders = [ticket.requesterId, ...(ticket.assigneeId ? [ticket.assigneeId] : []), ...ticket.followers.map((f) => f.userId)]
    .filter((id) => id !== req.user!.id);
  await notificationService.notifyMany(Array.from(new Set(stakeholders)), {
    type: NotificationType.NEW_ATTACHMENT,
    title: `Novo anexo no ticket ${ticket.protocol}`,
    message: `${req.user!.name} anexou o arquivo ${req.file.originalname}.`,
    link: `/tickets/${ticket.id}`,
    relatedTicketId: ticket.id,
  });

  emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
  sendSuccess(res, attachment, 201);
});

export const uploadInvoiceAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Nenhum arquivo enviado");
  if (!(await verifyFileSignature(req.file.path, req.file.mimetype))) {
    fs.unlinkSync(req.file.path);
    throw ApiError.badRequest("O conteúdo do arquivo não corresponde ao tipo informado");
  }
  const dueDate = req.body.dueDate as string | undefined;
  if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(new Date(dueDate).getTime())) {
    fs.unlinkSync(req.file.path);
    throw ApiError.badRequest("Informe a data de vencimento da nota fiscal");
  }
  const ticket = await ticketsService.findByIdOrFail(req.params.ticketId, req.user!);
  const ctx = req.invoiceUploadContext!;
  const ext = path.extname(req.file.originalname);

  const attachment = await attachmentRepo.save(
    attachmentRepo.create({
      ticketId: req.params.ticketId,
      originalName: `${ctx.baseFileName}${ext}`,
      physicalName: req.file.filename,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedById: req.user!.id,
      isInvoiceNote: true,
      dueDate,
    })
  );

  await historyService.record({
    ticketId: req.params.ticketId,
    userId: req.user!.id,
    action: HistoryAction.ATTACHMENT_ADDED,
    description: `${req.user!.name} anexou a nota fiscal ${attachment.originalName}. Este arquivo não pode ser alterado.`,
  });

  await auditService.log({ userId: req.user!.id, action: AuditAction.UPLOAD, entity: "Ticket", entityId: req.params.ticketId, req, metadata: { invoiceNote: true } });

  const stakeholders = [ticket.requesterId, ...(ticket.assigneeId ? [ticket.assigneeId] : []), ...ticket.followers.map((f) => f.userId)]
    .filter((id) => id !== req.user!.id);
  await notificationService.notifyMany(Array.from(new Set(stakeholders)), {
    type: NotificationType.NEW_INVOICE_NOTE,
    title: `Nota fiscal anexada ao ticket ${ticket.protocol}`,
    message: `${req.user!.name} anexou a nota fiscal ${attachment.originalName}.`,
    link: `/tickets/${ticket.id}`,
    relatedTicketId: ticket.id,
  });

  emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
  sendSuccess(res, attachment, 201);
});

export const downloadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const attachment = await attachmentRepo.findOne({ where: { id: req.params.attachmentId } });
  if (!attachment) throw ApiError.notFound("Anexo não encontrado");
  // Garante que o usuário tem acesso à organização do ticket dono do anexo.
  await ticketsService.findByIdOrFail(req.params.ticketId, req.user!);
  await auditService.log({ userId: req.user!.id, action: AuditAction.DOWNLOAD, entity: "Attachment", entityId: attachment.id, req });
  res.download(path.resolve(attachment.path), attachment.originalName);
});

export const removeAttachment = asyncHandler(async (req: Request, res: Response) => {
  const attachment = await attachmentRepo.findOne({ where: { id: req.params.attachmentId } });
  if (!attachment || attachment.ticketId !== req.params.ticketId) throw ApiError.notFound("Anexo não encontrado");
  // Nota fiscal é imutável por design — sem exclusão pela interface, mesmo
  // que o usuário tenha ATTACH_FILES (reforça a garantia dada na confirmação
  // exibida ao anexar).
  if (attachment.isInvoiceNote) throw ApiError.badRequest("Nota fiscal não pode ser excluída");
  const ticket = await ticketsService.findByIdOrFail(req.params.ticketId, req.user!);

  await attachmentRepo.remove(attachment);
  try {
    fs.unlinkSync(attachment.path);
  } catch {
    // Arquivo já pode não existir em disco — não impede a remoção do registro.
  }

  await historyService.record({
    ticketId: req.params.ticketId,
    userId: req.user!.id,
    action: HistoryAction.ATTACHMENT_REMOVED,
    description: `${req.user!.name} removeu o anexo ${attachment.originalName}.`,
  });
  await auditService.log({ userId: req.user!.id, action: AuditAction.DELETE, entity: "Attachment", entityId: attachment.id, req });

  emitBroadcast(SOCKET_EVENTS.TICKET_UPDATED, { id: ticket.id });
  sendSuccess(res, { message: "Anexo removido" });
});

// Serve o arquivo inline (Content-Disposition: inline), para pré-visualização
// em modal no frontend sem disparar o download do navegador. Mesma checagem
// de acesso do downloadAttachment, mas sem registrar como download no áudito.
export const viewAttachment = asyncHandler(async (req: Request, res: Response) => {
  const attachment = await attachmentRepo.findOne({ where: { id: req.params.attachmentId } });
  if (!attachment) throw ApiError.notFound("Anexo não encontrado");
  await ticketsService.findByIdOrFail(req.params.ticketId, req.user!);
  await auditService.log({ userId: req.user!.id, action: AuditAction.DOWNLOAD, entity: "Attachment", entityId: attachment.id, req, metadata: { view: true } });
  res.setHeader("Content-Type", attachment.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
  res.sendFile(path.resolve(attachment.path));
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  req.query.limit = "10000";
  const { items } = await ticketsService.list(req, req.user!);
  const header = "Protocolo;Titulo;Status;Prioridade;Responsavel;Departamento;Solicitante;Data\n";
  const rows = items.map((t) =>
    [t.protocol, t.title, t.status, t.priority, t.assignee?.name ?? "", t.department?.name ?? "", t.requester?.name ?? "", t.createdAt.toISOString()].join(";")
  );
  const csv = header + rows.join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=tickets.csv");
  res.send("﻿" + csv);
});
