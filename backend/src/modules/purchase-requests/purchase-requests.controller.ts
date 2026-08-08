import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { purchaseRequestsService } from "./purchase-requests.service";
import { historyService } from "../history/history.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const result = await purchaseRequestsService.create(req.user!, req.body, req);
  sendSuccess(res, result, 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = await purchaseRequestsService.update(req.user!, req.params.id, req.body, req);
  sendSuccess(res, result);
});

export const submit = asyncHandler(async (req: Request, res: Response) => {
  const result = await purchaseRequestsService.submit(req.user!, req.params.id, req);
  sendSuccess(res, result);
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const result = await purchaseRequestsService.cancel(req.user!, req.params.id, req);
  sendSuccess(res, result);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  const result = await purchaseRequestsService.approve(req.user!, req.params.id, req.body.reason, req);
  sendSuccess(res, result);
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  const result = await purchaseRequestsService.reject(req.user!, req.params.id, req.body.reason, req);
  sendSuccess(res, result);
});

export const findOne = asyncHandler(async (req: Request, res: Response) => {
  const result = await purchaseRequestsService.findByIdOrFail(req.params.id, req.user!);
  sendSuccess(res, result);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await purchaseRequestsService.list(req.user!, req);
  sendSuccess(res, items, 200, meta);
});

export const getHistory = asyncHandler(async (req: Request, res: Response) => {
  const result = await historyService.listByPurchaseRequest(req.params.id);
  sendSuccess(res, result);
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  req.query.limit = "10000";
  const { items } = await purchaseRequestsService.list(req.user!, req);
  const header = "Numero;Departamento;Solicitante;Fornecedor;Categoria;ValorEstimado;Prioridade;Status;Data\n";
  const rows = items.map((pr) =>
    [
      pr.number, pr.department?.name ?? "", pr.requester?.name ?? "", pr.supplier, pr.category,
      pr.estimatedValue, pr.priority, pr.status, pr.createdAt.toISOString(),
    ].join(";")
  );
  const csv = header + rows.join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=solicitacoes-compra.csv");
  res.send("﻿" + csv);
});
