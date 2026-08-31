import { Router, Request, Response, NextFunction } from "express";
import * as controller from "./purchase-requests.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey, PurchaseRequest } from "../../database/entities";
import { AppDataSource } from "../../config/data-source";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  CreatePurchaseRequestDto, UpdatePurchaseRequestDto, RejectPurchaseRequestDto, ApprovePurchaseRequestDto,
} from "./purchase-requests.dto";

const router = Router();
router.use(authenticate);

const purchaseRequestRepo = AppDataSource.getRepository(PurchaseRequest);

/**
 * GET /:id e /:id/history normalmente exigem VIEW_PURCHASE_REQUEST (quem
 * revisa/aprova em geral). Mas o próprio solicitante sempre pode acompanhar
 * a solicitação que ele mesmo abriu — mesmo sem essa permissão (grupos que
 * restringem a listagem completa só a quem aprova). Sem essa exceção, ele
 * ficaria sem conseguir nem ver o status do próprio rascunho/pendente, nem
 * completar o fluxo de editar/enviar/cancelar (que dependem de abrir a tela
 * de detalhe primeiro). Se o registro não existe, cai no authorize() normal
 * — o controller responde 404 pra quem tem permissão, 403 pra quem não tem.
 */
const authorizeView = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.isAdmin) return next();
  const purchaseRequest = await purchaseRequestRepo.findOne({ where: { id: req.params.id } });
  if (purchaseRequest && purchaseRequest.requesterId === req.user?.id) return next();
  return authorize(PermissionKey.VIEW_PURCHASE_REQUEST)(req, res, next);
});

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
router.get("/:id", authorizeView, controller.findOne);
router.get("/:id/history", authorizeView, controller.getHistory);

router.post("/", authorize(PermissionKey.CREATE_PURCHASE_REQUEST), validateDto(CreatePurchaseRequestDto), controller.create);
router.patch("/:id", authorize(PermissionKey.EDIT_PURCHASE_REQUEST), validateDto(UpdatePurchaseRequestDto), controller.update);
router.post("/:id/submit", authorize(PermissionKey.CREATE_PURCHASE_REQUEST, PermissionKey.EDIT_PURCHASE_REQUEST), controller.submit);
router.post("/:id/cancel", authorize(PermissionKey.CANCEL_PURCHASE_REQUEST), controller.cancel);
router.post("/:id/approve", authorize(PermissionKey.APPROVE_PURCHASE_REQUEST), validateDto(ApprovePurchaseRequestDto), controller.approve);
router.post("/:id/reject", authorize(PermissionKey.APPROVE_PURCHASE_REQUEST), validateDto(RejectPurchaseRequestDto), controller.reject);

// Anexos existem somente em Tickets — solicitações de compra não têm upload/download de arquivos.

export default router;
