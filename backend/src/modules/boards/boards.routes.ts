import { Router } from "express";
import * as controller from "./boards.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import { ReplaceBoardColumnsDto } from "./boards.dto";

const router = Router();
router.use(authenticate);

router.get("/mine", authorize(PermissionKey.VIEW_TICKET), controller.getMine);
// Nomes/cores de coluna não são dado sensível — liberado a qualquer um com
// VIEW_TICKET (não precisa ser do próprio departamento), é o que alimenta o
// seletor de departamento de quem tem acesso irrestrito ao Kanban.
router.get("/department/:departmentId", authorize(PermissionKey.VIEW_TICKET), controller.getForDepartment);
router.put("/:boardId/columns", authorize(PermissionKey.MANAGE_DEPARTMENTS), validateDto(ReplaceBoardColumnsDto), controller.replaceColumns);

export default router;
