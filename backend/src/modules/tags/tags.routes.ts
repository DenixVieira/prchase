import { Router } from "express";
import * as controller from "./tags.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import { CreateTagDto, UpdateTagDto } from "./tags.dto";

const router = Router();
router.use(authenticate);

// Listar é liberado a quem visualiza tickets (precisa pra exibir/selecionar
// etiquetas no ticket); criar/editar/excluir a etiqueta em si exige CREATE_TAG.
router.get("/", authorize(PermissionKey.VIEW_TICKET), controller.list);
router.post("/", authorize(PermissionKey.CREATE_TAG), validateDto(CreateTagDto), controller.create);
router.patch("/:id", authorize(PermissionKey.CREATE_TAG), validateDto(UpdateTagDto), controller.update);
router.delete("/:id", authorize(PermissionKey.CREATE_TAG), controller.remove);

export default router;
