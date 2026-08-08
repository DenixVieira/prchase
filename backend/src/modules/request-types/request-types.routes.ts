import { Router } from "express";
import * as controller from "./request-types.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import { CreateRequestTypeDto, UpdateRequestTypeDto, ReplaceRequestFieldsDto } from "./request-types.dto";

const router = Router();
router.use(authenticate);

// Card grid de "Nova Solicitação" — liberado a qualquer usuário autenticado,
// igual ao /departments/active (precisa carregar antes de saber se o usuário
// tem CREATE_REQUEST pra algum tipo específico).
router.get("/active", controller.listActive);
router.get("/", authorize(PermissionKey.MANAGE_REQUEST_TYPES), controller.listAll);
// Também liberado a qualquer autenticado (não só MANAGE_REQUEST_TYPES): é o
// que o DynamicRequestFormPage usa pra carregar os campos do tipo escolhido
// ao preencher "Nova Solicitação" — exigir a permissão administrativa aqui
// travava esse fluxo pra qualquer usuário comum ("Tipo de solicitação não
// encontrado", já que o 403 vira "sem dado" na tela).
router.get("/:id", controller.findOne);
router.post("/", authorize(PermissionKey.MANAGE_REQUEST_TYPES), validateDto(CreateRequestTypeDto), controller.create);
router.patch("/:id", authorize(PermissionKey.MANAGE_REQUEST_TYPES), validateDto(UpdateRequestTypeDto), controller.update);
router.delete("/:id", authorize(PermissionKey.MANAGE_REQUEST_TYPES), controller.remove);
router.put("/:id/fields", authorize(PermissionKey.MANAGE_REQUEST_TYPES), validateDto(ReplaceRequestFieldsDto), controller.replaceFields);

export default router;
