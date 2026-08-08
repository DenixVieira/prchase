import { Request } from "express";
import { PaginationMeta } from "./ApiResponse";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder: "ASC" | "DESC";
  search?: string;
}

/**
 * `allowedSortFields`, quando informado, restringe `sortBy` a uma lista
 * fechada de colunas reais da entidade — o valor vira parte literal da
 * query (`orderBy(`alias.${sortBy}`)`) em cada serviço, então aceitar
 * qualquer string do cliente aqui abriria a porta pra injeção via nome de
 * coluna. Fora da lista, cai silenciosamente no `defaultSortBy`.
 */
export function getPaginationParams(req: Request, defaultSortBy = "createdAt", allowedSortFields?: string[]): PaginationParams {
  const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "20"), 10) || 20, 1), 100);
  const requestedSortBy = (req.query.sortBy as string) || defaultSortBy;
  const sortBy = !allowedSortFields || allowedSortFields.includes(requestedSortBy) ? requestedSortBy : defaultSortBy;
  const sortOrder = (String(req.query.sortOrder ?? "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC") as "ASC" | "DESC";
  const search = req.query.search ? String(req.query.search).trim() : undefined;
  return { page, limit, skip: (page - 1) * limit, sortBy, sortOrder, search };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) };
}
