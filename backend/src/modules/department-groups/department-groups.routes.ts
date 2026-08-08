import { Router } from "express";
import * as controller from "./department-groups.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import { CreateDepartmentGroupDto, UpdateDepartmentGroupDto } from "./department-groups.dto";

const router = Router();
router.use(authenticate);

// Mesmo público da listagem de departamentos (MANAGE_DEPARTMENTS ou
// MANAGE_USERS) — quem gerencia usuários precisa enxergar os grupos pra
// entender a organização dos departamentos, mesmo sem poder editá-los.
router.get("/", authorize(PermissionKey.MANAGE_DEPARTMENTS, PermissionKey.MANAGE_USERS), controller.list);
router.post("/", authorize(PermissionKey.MANAGE_DEPARTMENTS), validateDto(CreateDepartmentGroupDto), controller.create);
router.patch("/:id", authorize(PermissionKey.MANAGE_DEPARTMENTS), validateDto(UpdateDepartmentGroupDto), controller.update);
router.delete("/:id", authorize(PermissionKey.MANAGE_DEPARTMENTS), controller.remove);

export default router;
