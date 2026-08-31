import { Router, Request, Response, NextFunction } from "express";
import * as controller from "./tickets.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { upload, uploadInvoice } from "../../middlewares/upload";
import { resolveTicketUploadContext, resolveTicketInvoiceUploadContext } from "../../middlewares/uploadContext";
import { PermissionKey, BoardColumn } from "../../database/entities";
import { AppDataSource } from "../../config/data-source";
import {
  UpdateTicketDto, MoveTicketDto, AssignTicketDto, ChangePriorityDto, CreateCommentDto, AddFollowerDto, AddTagDto,
} from "./tickets.dto";

const router = Router();
router.use(authenticate);

const boardColumnRepo = AppDataSource.getRepository(BoardColumn);

/**
 * Validação adicional: mover para uma coluna isDone exige RESOLVE_TICKET,
 * mover para uma coluna isCancelled exige CANCEL_TICKET, demais
 * movimentações exigem MOVE_TICKET. A coluna de destino é carregada aqui
 * (e não reaproveitada no controller) só pra decidir a permissão — o
 * service confere de novo antes de aplicar.
 */
async function authorizeMove(req: Request, res: Response, next: NextFunction) {
  const columnId = req.body?.columnId as string | undefined;
  const column = columnId ? await boardColumnRepo.findOne({ where: { id: columnId } }) : null;
  if (column?.isDone) {
    return authorize(PermissionKey.RESOLVE_TICKET)(req, res, next);
  }
  if (column?.isCancelled) {
    return authorize(PermissionKey.CANCEL_TICKET)(req, res, next);
  }
  return authorize(PermissionKey.MOVE_TICKET)(req, res, next);
}

/**
 * Qualquer usuário autenticado pode deixar de acompanhar (remover a si mesmo).
 * Remover OUTRO usuário como acompanhante exige a permissão MOVE_TICKET.
 */
function authorizeRemoveFollower(req: Request, res: Response, next: NextFunction) {
  if (req.params.userId === req.user?.id) {
    return next();
  }
  return authorize(PermissionKey.MOVE_TICKET)(req, res, next);
}

/**
 * Listagem/exportação de tickets arquivados (?archived=true) usa uma
 * permissão própria (VIEW_ARCHIVED_TICKETS), separada da listagem normal do
 * Kanban — um departamento pode ver o board sem enxergar o histórico de
 * arquivados, e vice-versa.
 */
function authorizeList(req: Request, res: Response, next: NextFunction) {
  if (req.query.archived === "true") {
    return authorize(PermissionKey.VIEW_ARCHIVED_TICKETS)(req, res, next);
  }
  return authorize(PermissionKey.VIEW_TICKET)(req, res, next);
}

/**
 * @openapi
 * /tickets:
 *   get:
 *     summary: Lista tickets (Kanban) com filtros, paginação e busca
 *     tags: [Tickets]
 */
router.get("/", authorizeList, controller.list);
router.get("/export/csv", authorizeList, controller.exportCsv);
// Antes de "/:id" — senão "/search" seria interpretado como um ID de ticket.
router.get("/search", authorize(PermissionKey.VIEW_TICKET), controller.quickSearch);
router.get("/:id", authorize(PermissionKey.VIEW_TICKET), controller.findOne);
router.get("/:id/history", authorize(PermissionKey.VIEW_TICKET), controller.getHistory);

router.patch("/:id", authorize(PermissionKey.MOVE_TICKET), validateDto(UpdateTicketDto), controller.update);
router.delete("/:id", authorize(PermissionKey.DELETE_TICKET), controller.remove);
router.post("/:id/move", validateDto(MoveTicketDto), authorizeMove, controller.move);
router.post("/:id/assign", authorize(PermissionKey.MOVE_TICKET), validateDto(AssignTicketDto), controller.assign);
router.post("/:id/priority", authorize(PermissionKey.MOVE_TICKET), validateDto(ChangePriorityDto), controller.changePriority);

// Arquivar/desarquivar usa a mesma permissão de mover o ticket no Kanban:
// é uma ação de organização/housekeeping do fluxo, não uma permissão à parte.
router.post("/:id/archive", authorize(PermissionKey.MOVE_TICKET), controller.archive);
router.post("/:id/unarchive", authorize(PermissionKey.MOVE_TICKET), controller.unarchive);

router.get("/:id/comments", authorize(PermissionKey.VIEW_TICKET), controller.getComments);
router.post("/:id/comments", authorize(PermissionKey.COMMENT_TICKET), validateDto(CreateCommentDto), controller.addComment);

router.post("/:id/followers", authorize(PermissionKey.VIEW_TICKET), validateDto(AddFollowerDto), controller.addFollower);
router.delete("/:id/followers/:userId", authorizeRemoveFollower, controller.removeFollower);

// Aplicar/remover etiqueta é uma alteração no ticket, não no catálogo de
// etiquetas — usa MOVE_TICKET (mesma permissão de atribuir responsável/
// prioridade), não CREATE_TAG (que só rege o catálogo em si).
router.post("/:id/tags", authorize(PermissionKey.MOVE_TICKET), validateDto(AddTagDto), controller.addTag);
router.delete("/:id/tags/:tagId", authorize(PermissionKey.MOVE_TICKET), controller.removeTag);

router.post(
  "/:ticketId/attachments",
  authorize(PermissionKey.ATTACH_FILES),
  resolveTicketUploadContext,
  upload.single("file"),
  controller.uploadAttachment
);
router.post(
  "/:ticketId/attachments/invoice",
  authorize(PermissionKey.ATTACH_FILES),
  resolveTicketInvoiceUploadContext,
  uploadInvoice.single("file"),
  controller.uploadInvoiceAttachment
);
router.get(
  "/:ticketId/attachments/:attachmentId/download",
  authorize(PermissionKey.VIEW_TICKET),
  controller.downloadAttachment
);
router.get(
  "/:ticketId/attachments/:attachmentId/view",
  authorize(PermissionKey.VIEW_TICKET),
  controller.viewAttachment
);
router.delete(
  "/:ticketId/attachments/:attachmentId",
  authorize(PermissionKey.ATTACH_FILES),
  controller.removeAttachment
);

export default router;
