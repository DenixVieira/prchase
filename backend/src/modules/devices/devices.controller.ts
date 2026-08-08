import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { devicesService } from "./devices.service";
import { auditService } from "../audit/audit.service";
import { AppDataSource } from "../../config/data-source";
import { DeviceAttachment, AuditAction } from "../../database/entities";
import { ApiError } from "../../utils/ApiError";
import { verifyFileSignature } from "../../utils/fileSignature";

const attachmentRepo = AppDataSource.getRepository(DeviceAttachment);

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await devicesService.list(req.user!, req);
  sendSuccess(res, items, 200, meta);
});

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await devicesService.findByIdOrFail(req.params.id, req.user!));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await devicesService.create(req.user!, req.body, req), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await devicesService.update(req.user!, req.params.id, req.body, req));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await devicesService.remove(req.user!, req.params.id, req);
  sendSuccess(res, { message: "Equipamento excluído" });
});

export const addMaintenance = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await devicesService.addMaintenance(req.user!, req.params.id, req.body, req), 201);
});

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("Nenhum arquivo enviado");
  // O Content-Type do multer vem do navegador e é trivial de falsificar — confere os magic bytes reais.
  if (!(await verifyFileSignature(req.file.path, req.file.mimetype))) {
    fs.unlinkSync(req.file.path);
    throw ApiError.badRequest("O conteúdo do arquivo não corresponde ao tipo informado");
  }
  await devicesService.findByIdOrFail(req.params.deviceId, req.user!);

  const attachment = await attachmentRepo.save(
    attachmentRepo.create({
      deviceId: req.params.deviceId,
      originalName: req.file.originalname,
      physicalName: req.file.filename,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedById: req.user!.id,
    })
  );

  await auditService.log({ userId: req.user!.id, action: AuditAction.UPLOAD, entity: "Device", entityId: req.params.deviceId, req });
  sendSuccess(res, attachment, 201);
});

export const downloadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const attachment = await attachmentRepo.findOne({ where: { id: req.params.attachmentId } });
  if (!attachment) throw ApiError.notFound("Anexo não encontrado");
  await devicesService.findByIdOrFail(req.params.deviceId, req.user!);
  await auditService.log({ userId: req.user!.id, action: AuditAction.DOWNLOAD, entity: "DeviceAttachment", entityId: attachment.id, req });
  res.download(path.resolve(attachment.path), attachment.originalName);
});

export const viewAttachment = asyncHandler(async (req: Request, res: Response) => {
  const attachment = await attachmentRepo.findOne({ where: { id: req.params.attachmentId } });
  if (!attachment) throw ApiError.notFound("Anexo não encontrado");
  await devicesService.findByIdOrFail(req.params.deviceId, req.user!);
  await auditService.log({ userId: req.user!.id, action: AuditAction.DOWNLOAD, entity: "DeviceAttachment", entityId: attachment.id, req, metadata: { view: true } });
  res.setHeader("Content-Type", attachment.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
  res.sendFile(path.resolve(attachment.path));
});

export const removeAttachment = asyncHandler(async (req: Request, res: Response) => {
  const attachment = await attachmentRepo.findOne({ where: { id: req.params.attachmentId } });
  if (!attachment || attachment.deviceId !== req.params.deviceId) throw ApiError.notFound("Anexo não encontrado");
  await devicesService.findByIdOrFail(req.params.deviceId, req.user!);

  await attachmentRepo.remove(attachment);
  try {
    fs.unlinkSync(attachment.path);
  } catch {
    // Arquivo já pode não existir em disco — não impede a remoção do registro.
  }

  await auditService.log({ userId: req.user!.id, action: AuditAction.DELETE, entity: "DeviceAttachment", entityId: attachment.id, req });
  sendSuccess(res, { message: "Anexo removido" });
});
