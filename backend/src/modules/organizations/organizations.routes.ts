import { Router } from "express";
import * as controller from "./organizations.controller";
import { authenticate } from "../../middlewares/authenticate";
import { authorize } from "../../middlewares/authorize";
import { validateDto } from "../../utils/validate";
import { PermissionKey } from "../../database/entities";
import { CreateOrganizationDto, UpdateOrganizationDto } from "./organizations.dto";

const router = Router();
router.use(authenticate);

/**
 * Gestão de Organizações é administrativa: reaproveita a permissão
 * MANAGE_DEPARTMENTS (mesmo público que já configura departamentos e RBAC).
 * As listagens leves (/active e /my-accessible) são liberadas a qualquer
 * usuário autenticado — usadas para exibir nomes e para o seletor de
 * organização ao criar uma solicitação de compra.
 */
router.get("/active", controller.listActive);
router.get("/my-accessible", controller.myAccessible);
router.get("/", authorize(PermissionKey.MANAGE_DEPARTMENTS), controller.list);
// Exportação/consulta de notas fiscais: permissão própria (EXPORT_INVOICES) —
// o acesso à organização específica é validado dentro do serviço (assertOrganizationAccess).
router.get("/:id/export-invoices-zip", authorize(PermissionKey.EXPORT_INVOICES), controller.exportInvoicesZip);
router.get("/:id/invoices", authorize(PermissionKey.EXPORT_INVOICES), controller.listInvoices);
router.get("/:id", authorize(PermissionKey.MANAGE_DEPARTMENTS), controller.findOne);
router.post("/", authorize(PermissionKey.MANAGE_DEPARTMENTS), validateDto(CreateOrganizationDto), controller.create);
router.patch("/:id", authorize(PermissionKey.MANAGE_DEPARTMENTS), validateDto(UpdateOrganizationDto), controller.update);
router.delete("/:id", authorize(PermissionKey.MANAGE_DEPARTMENTS), controller.remove);

export default router;
