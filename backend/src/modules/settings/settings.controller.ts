import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { mailerService } from "../../mailer/mailer.service";
import { auditService } from "../audit/audit.service";
import { AuditAction } from "../../database/entities";

export const getSmtp = asyncHandler(async (_req: Request, res: Response) => {
  const config = await mailerService.getConfig();
  sendSuccess(res, { ...config, password: config.password ? "********" : "" });
});

export const updateSmtp = asyncHandler(async (req: Request, res: Response) => {
  await mailerService.saveConfig(req.body);
  await auditService.log({ userId: req.user!.id, action: AuditAction.UPDATE, entity: "Settings", entityId: "smtp", req });
  sendSuccess(res, { message: "Configurações SMTP salvas com sucesso" });
});

export const testSmtp = asyncHandler(async (req: Request, res: Response) => {
  const result = await mailerService.testConnection(req.body);
  sendSuccess(res, result);
});
