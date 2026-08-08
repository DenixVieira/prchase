import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { login, password } = req.body;
  const result = await authService.login(login, password, req);
  sendSuccess(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken, req);
  sendSuccess(res, result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.id, req);
  sendSuccess(res, { message: "Logout realizado com sucesso" });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.me(req.user!.id);
  sendSuccess(res, result);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  sendSuccess(res, { message: "Senha alterada com sucesso" });
});

export const changeEmail = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newEmail } = req.body;
  const result = await authService.changeEmail(req.user!.id, currentPassword, newEmail, req);
  sendSuccess(res, result);
});
