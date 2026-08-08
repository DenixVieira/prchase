import { Router } from "express";
import * as controller from "./purchase-requests.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import {
  CreatePurchaseRequestDto, UpdatePurchaseRequestDto, RejectPurchaseRequestDto, ApprovePurchaseRequestDto,
} from "./purchase-requests.dto";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /purchase-requests:
 *   get:
 *     summary: Lista solicitações de compra com paginação, filtros e busca
 *     tags: [PurchaseRequests]
 *   post:
 *     summary: Cria uma solicitação de compra em rascunho
 *     tags: [PurchaseRequests]
 */
router.get("/", authorize(PermissionKey.VIEW_PURCHASE_REQUEST), controller.list);
router.get("/export/csv", authorize(PermissionKey.VIEW_PURCHASE_REQUEST), controller.exportCsv);
router.get("/:id", authorize(PermissionKey.VIEW_PURCHASE_REQUEST), controller.findOne);
router.get("/:id/history", authorize(PermissionKey.VIEW_PURCHASE_REQUEST), controller.getHistory);

router.post("/", authorize(PermissionKey.CREATE_PURCHASE_REQUEST), validateDto(CreatePurchaseRequestDto), controller.create);
router.patch("/:id", authorize(PermissionKey.EDIT_PURCHASE_REQUEST), validateDto(UpdatePurchaseRequestDto), controller.update);
router.post("/:id/submit", authorize(PermissionKey.CREATE_PURCHASE_REQUEST, PermissionKey.EDIT_PURCHASE_REQUEST), controller.submit);
router.post("/:id/cancel", authorize(PermissionKey.CANCEL_PURCHASE_REQUEST), controller.cancel);
router.post("/:id/approve", authorize(PermissionKey.APPROVE_PURCHASE_REQUEST), validateDto(ApprovePurchaseRequestDto), controller.approve);
router.post("/:id/reject", authorize(PermissionKey.APPROVE_PURCHASE_REQUEST), validateDto(RejectPurchaseRequestDto), controller.reject);

// Anexos existem somente em Tickets — solicitações de compra não têm upload/download de arquivos.

export default router;
