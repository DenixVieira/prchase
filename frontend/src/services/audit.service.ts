import { api } from "./api";
import { AuditLog, ApiListResponse, PaginationMeta } from "@/types";

export const auditService = {
  async list(params: Record<string, unknown>): Promise<{ items: AuditLog[]; meta: PaginationMeta }> {
    const { data } = await api.get<ApiListResponse<AuditLog>>("/audit", { params });
    return { items: data.data, meta: data.meta };
  },
  async exportCsv(): Promise<Blob> {
    const { data } = await api.get("/audit/export/csv", { responseType: "blob" });
    return data;
  },
};
