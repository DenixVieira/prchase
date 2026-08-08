import { Router } from "express";
import * as controller from "./departments.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import { CreateDepartmentDto, UpdateDepartmentDto, UpdatePermissionsDto } from "./departments.dto";

const router = Router();
router.use(authenticate);

router.get("/permissions/catalog", authorize(PermissionKey.MANAGE_DEPARTMENTS), controller.listAllPermissions);
// Sem authorize() extra: liberado a qualquer usuário autenticado, igual ao
// equivalente em organizations — usado para preencher selects/filtros em
// telas que não são administrativas (Equipamentos, Solicitações etc.).
router.get("/active", controller.listActive);
router.get("/", authorize(PermissionKey.MANAGE_DEPARTMENTS, PermissionKey.MANAGE_USERS), controller.list);
router.get("/:id", authorize(PermissionKey.MANAGE_DEPARTMENTS, PermissionKey.MANAGE_USERS), controller.findOne);
router.post("/", authorize(PermissionKey.MANAGE_DEPARTMENTS), validateDto(CreateDepartmentDto), controller.create);
router.patch("/:id", authorize(PermissionKey.MANAGE_DEPARTMENTS), validateDto(UpdateDepartmentDto), controller.update);
router.delete("/:id", authorize(PermissionKey.MANAGE_DEPARTMENTS), controller.remove);
router.put("/:id/permissions", authorize(PermissionKey.MANAGE_DEPARTMENTS), validateDto(UpdatePermissionsDto), controller.updatePermissions);

export default router;
