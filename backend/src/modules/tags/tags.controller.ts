import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { tagsService } from "./tags.service";

export const list = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, await tagsService.list());
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await tagsService.create(req.user!.id, req.body, req), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await tagsService.update(req.user!.id, req.params.id, req.body, req));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await tagsService.remove(req.user!.id, req.params.id, req);
  sendSuccess(res, { message: "Etiqueta removida" });
});
