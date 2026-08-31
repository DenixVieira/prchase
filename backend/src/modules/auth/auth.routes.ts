import { Router } from "express";
import * as controller from "./auth.controller";
import { validateDto } from "../../utils/validate";
import { LoginDto, RefreshTokenDto, ChangePasswordDto, ChangeEmailDto, ChangeAvatarDto } from "./auth.dto";
import { authenticate } from "../../middlewares/authenticate";
import { authRateLimiter, authAccountRateLimiter } from "../../middlewares/rateLimiter";

const router = Router();

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Autentica um usuário e retorna tokens de acesso
 *     tags: [Auth]
 */
router.post("/login", authRateLimiter, authAccountRateLimiter, validateDto(LoginDto), controller.login);
router.post("/refresh", validateDto(RefreshTokenDto), controller.refresh);
router.post("/logout", authenticate, controller.logout);
router.get("/me", authenticate, controller.me);
router.post("/change-password", authenticate, validateDto(ChangePasswordDto), controller.changePassword);
router.post("/change-email", authenticate, validateDto(ChangeEmailDto), controller.changeEmail);
router.post("/change-avatar", authenticate, validateDto(ChangeAvatarDto), controller.changeAvatar);

export default router;
