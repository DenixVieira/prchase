import { Request, Response } from "express";
import archiver from "archiver";
import path from "path";
import fs from "fs";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { organizationsService } from "./organizations.service";
import { auditService } from "../audit/audit.service";
import { AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { sanitizeFileNameSegment } from "../../utils/invoiceFile";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await organizationsService.list(req);
  sendSuccess(res, items, 200, meta);
});

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await organizationsService.listActive());
});

export const myAccessible = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await organizationsService.myAccessible(req.user!));
});

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await organizationsService.findByIdOrFail(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await organizationsService.create(req.user!.id, req.body, req), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await organizationsService.update(req.user!.id, req.params.id, req.body, req));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await organizationsService.remove(req.user!.id, req.params.id, req);
  sendSuccess(res, { message: "Organização removida" });
});

export const listInvoices = asyncHandler(async (req: Request, res: Response) => {
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const { attachments } = await organizationsService.getInvoiceAttachmentsForExport(
    req.user!, req.params.id, startDate ?? "", endDate ?? ""
  );
  sendSuccess(res, attachments);
});

export const exportInvoicesZip = asyncHandler(async (req: Request, res: Response) => {
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const { organization, attachments } = await organizationsService.getInvoiceAttachmentsForExport(
    req.user!, req.params.id, startDate ?? "", endDate ?? ""
  );

  if (attachments.length === 0) {
    throw ApiError.notFound("Nenhuma nota fiscal encontrada para esta organização no período informado");
  }

  await auditService.log({
    userId: req.user!.id,
    action: AuditAction.DOWNLOAD,
    entity: "Organization",
    entityId: organization.id,
    req,
    metadata: { invoiceExport: true, startDate, endDate, count: attachments.length },
  });

  const zipFileName = `${sanitizeFileNameSegment(organization.name)}-notas-fiscais-${startDate}-a-${endDate}.zip`;
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFileName}"`);

  // Nível 6 (padrão do zlib): tamanho final quase idêntico ao nível 9, mas
  // consideravelmente mais rápido/menos CPU — relevante porque a compactação
  // roda de forma síncrona dentro da própria requisição HTTP.
  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("error", (err) => {
    logger.error({ err }, "Erro ao gerar ZIP de notas fiscais");
    res.destroy(err);
  });
  archive.pipe(res);

  const uploadsRoot = path.join(process.cwd(), env.uploadsDir);
  for (const attachment of attachments) {
    if (!fs.existsSync(attachment.path)) continue;
    const relativeDir = path.relative(uploadsRoot, path.dirname(attachment.path));
    archive.file(attachment.path, { name: path.join(relativeDir, attachment.originalName) });
  }

  await archive.finalize();
});
