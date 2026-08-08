import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { notificationService } from "./notification.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const onlyUnread = req.query.unread === "true";
  const result = await notificationService.listForUser(req.user!.id, onlyUnread);
  sendSuccess(res, result);
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationService.unreadCount(req.user!.id);
  sendSuccess(res, { count });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAsRead(req.user!.id, req.params.id);
  sendSuccess(res, { message: "Notificação marcada como lida" });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.markAllAsRead(req.user!.id);
  sendSuccess(res, { message: "Todas as notificações foram marcadas como lidas" });
});

export const updatePreference = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.updatePreference(req.user!.id, req.body.preference);
  sendSuccess(res, { message: "Preferência de notificação atualizada" });
});

export const updateMutedTypes = asyncHandler(async (req: Request, res: Response) => {
  await notificationService.updateMutedTypes(req.user!.id, req.body.mutedTypes);
  sendSuccess(res, { message: "Tipos de notificação atualizados" });
});
