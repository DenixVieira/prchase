import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination";
import { AppDataSource } from "../../config/data-source";
import { AuditLog } from "../../database/entities";

const repo = AppDataSource.getRepository(AuditLog);

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sortBy, sortOrder } = getPaginationParams(req, "createdAt", ["createdAt", "action", "entity"]);
  const qb = repo.createQueryBuilder("log").leftJoinAndSelect("log.user", "user");

  if (req.query.action) qb.andWhere("log.action = :action", { action: req.query.action });
  if (req.query.entity) qb.andWhere("log.entity = :entity", { entity: req.query.entity });
  if (req.query.userId) qb.andWhere("log.userId = :userId", { userId: req.query.userId });
  if (req.query.dateFrom) qb.andWhere("log.createdAt >= :dateFrom", { dateFrom: req.query.dateFrom });
  // Fim do dia informado, para incluir todos os registros daquela data (mesmo
  // padrão usado nos filtros de período de tickets/solicitações).
  if (req.query.dateTo) qb.andWhere("log.createdAt <= :dateTo", { dateTo: `${req.query.dateTo} 23:59:59.999` });

  qb.orderBy(`log.${sortBy}`, sortOrder).skip(skip).take(limit);
  const [items, total] = await qb.getManyAndCount();
  sendSuccess(res, items, 200, buildPaginationMeta(page, limit, total));
});

export const exportCsv = asyncHandler(async (_req: Request, res: Response) => {
  const items = await repo.find({ relations: ["user"], order: { createdAt: "DESC" }, take: 10000 });
  const header = "Data;Usuario;Acao;Entidade;EntidadeId;IP\n";
  const rows = items.map((log) =>
    [log.createdAt.toISOString(), log.user?.name ?? "Sistema", log.action, log.entity, log.entityId ?? "", log.ipAddress ?? ""].join(";")
  );
  const csv = header + rows.join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=auditoria.csv");
  res.send("﻿" + csv);
});
