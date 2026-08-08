import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { hasPermission } from "../../utils/permissionAccess";
import { PermissionKey } from "../../database/entities";
import { requestTypesService } from "./request-types.service";

export const listActive = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await requestTypesService.listActive(req.user!));
});

export const listAll = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await requestTypesService.listAll());
});

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  // Quem administra tipos de solicitação enxerga qualquer um (inclusive fora
  // de alcance por organização) — os demais só o que está visível pra eles,
  // já que esta rota é o que o formulário de "Nova Solicitação" usa pra
  // carregar os campos do tipo escolhido.
  const canManage = await hasPermission(req.user!, PermissionKey.MANAGE_REQUEST_TYPES);
  const requestType = canManage
    ? await requestTypesService.findByIdOrFail(req.params.id)
    : await requestTypesService.findVisibleOrFail(req.params.id, req.user!);
  sendSuccess(res, requestType);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await requestTypesService.create(req.user!.id, req.body, req), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await requestTypesService.update(req.user!.id, req.params.id, req.body, req));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await requestTypesService.remove(req.user!.id, req.params.id, req);
  sendSuccess(res, { message: "Tipo de solicitação removido" });
});

export const replaceFields = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await requestTypesService.replaceFields(req.user!.id, req.params.id, req.body.fields, req));
});
