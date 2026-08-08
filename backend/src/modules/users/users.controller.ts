import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { usersService } from "./users.service";

export const search = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await usersService.search(req));
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await usersService.list(req);
  sendSuccess(res, items, 200, meta);
});

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await usersService.findByIdOrFail(req.params.id));
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await usersService.create(req.user!.id, req.body, req), 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await usersService.update(req.user!.id, req.params.id, req.body, req));
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await usersService.remove(req.user!.id, req.params.id, req);
  sendSuccess(res, { message: "Usuário removido" });
});

export const block = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await usersService.setActive(req.user!.id, req.params.id, false, req));
});

export const unblock = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await usersService.setActive(req.user!.id, req.params.id, true, req));
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await usersService.resetPassword(req.user!.id, req.params.id, req.body.newPassword, req);
  sendSuccess(res, { message: "Senha redefinida com sucesso" });
});

export const changeDepartment = asyncHandler(async (req: Request, res: Response) => {
  sendSuccess(res, await usersService.changeDepartment(req.user!.id, req.params.id, req.body.departmentId, req));
});
