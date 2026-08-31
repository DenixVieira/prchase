import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { boardsService } from "./boards.service";

export const getMine = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user!.departmentId) throw ApiError.badRequest("Você não está vinculado a um departamento");
  sendSuccess(res, await boardsService.getByDepartmentId(req.user!.departmentId));
});

export const getForDepartment = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await boardsService.getByDepartmentId(req.params.departmentId));
});

export const replaceColumns = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await boardsService.replaceColumns(req.user!.id, req.params.boardId, req.body.columns, req));
});
