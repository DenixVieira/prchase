import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { departmentsService } from "./departments.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await departmentsService.list(req);
  sendSuccess(res, items, 200, meta);
});

export const listActive = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await departmentsService.listActive());
});

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await departmentsService.findByIdOrFail(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await departmentsService.create(req.user!.id, req.body, req), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await departmentsService.update(req.user!.id, req.params.id, req.body, req));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await departmentsService.remove(req.user!.id, req.params.id, req);
  sendSuccess(res, { message: "Departamento removido" });
});

export const updatePermissions = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await departmentsService.updatePermissions(req.user!.id, req.params.id, req.body.permissionKeys, req));
});

export const listAllPermissions = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await departmentsService.listAllPermissions());
});
