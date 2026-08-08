import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { departmentGroupsService } from "./department-groups.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await departmentGroupsService.list());
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await departmentGroupsService.create(req.user!.id, req.body, req), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await departmentGroupsService.update(req.user!.id, req.params.id, req.body, req));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await departmentGroupsService.remove(req.user!.id, req.params.id, req);
  sendSuccess(res, { message: "Grupo removido" });
});
