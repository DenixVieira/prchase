import { Router } from "express";
import * as controller from "./users.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangeDepartmentDto } from "./users.dto";

const router = Router();

/**
 * Busca leve de usuários para pickers (atribuir responsável de ticket,
 * adicionar acompanhante) — qualquer usuário autenticado pode usar, sem
 * exigir a permissão administrativa MANAGE_USERS. Precisa vir ANTES do
 * router.use(authorize(...)) abaixo, que protege as rotas administrativas.
 */
router.get("/search", authenticate, controller.search);

router.use(authenticate, authorize(PermissionKey.MANAGE_USERS));

router.get("/", controller.list);
router.get("/:id", controller.findOne);
router.post("/", validateDto(CreateUserDto), controller.create);
router.patch("/:id", validateDto(UpdateUserDto), controller.update);
router.delete("/:id", controller.remove);
router.post("/:id/block", controller.block);
router.post("/:id/unblock", controller.unblock);
router.post("/:id/reset-password", validateDto(ResetPasswordDto), controller.resetPassword);
router.post("/:id/change-department", validateDto(ChangeDepartmentDto), controller.changeDepartment);

export default router;
