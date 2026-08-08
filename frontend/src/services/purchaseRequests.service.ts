import { api } from "./api";
import { PurchaseRequest, HistoryEntry, ApiListResponse, PaginationMeta, Priority } from "@/types";

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  departmentId?: string;
  organizationId?: string;
  priority?: string;
  mine?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface CreatePurchaseRequestPayload {
  // Sem departmentId: o backend sempre usa o departamento do usuário logado.
  // organizationId é escolhido manualmente pelo usuário no formulário.
  organizationId: string;
  costCenter: string;
  supplier: string;
  category: string;
  description: string;
  justification: string;
  estimatedValue: number;
  priority: Priority;
  observations?: string;
}

export interface UpdatePurchaseRequestPayload {
  costCenter?: string;
  supplier?: string;
  category?: string;
  description?: string;
  justification?: string;
  estimatedValue?: number;
  priority?: Priority;
  observations?: string;
}

export const purchaseRequestsService = {
  async list(params: ListParams): Promise<{ items: PurchaseRequest[]; meta: PaginationMeta }> {
    const { data } = await api.get<ApiListResponse<PurchaseRequest>>("/purchase-requests", { params });
    return { items: data.data, meta: data.meta };
  },
  async findOne(id: string): Promise<PurchaseRequest> {
    const { data } = await api.get(`/purchase-requests/${id}`);
    return data.data;
  },
  async create(payload: CreatePurchaseRequestPayload): Promise<PurchaseRequest> {
    const { data } = await api.post("/purchase-requests", payload);
    return data.data;
  },
  async update(id: string, payload: UpdatePurchaseRequestPayload): Promise<PurchaseRequest> {
    const { data } = await api.patch(`/purchase-requests/${id}`, payload);
    return data.data;
  },
  async submit(id: string): Promise<PurchaseRequest> {
    const { data } = await api.post(`/purchase-requests/${id}/submit`);
    return data.data;
  },
  async cancel(id: string): Promise<PurchaseRequest> {
    const { data } = await api.post(`/purchase-requests/${id}/cancel`);
    return data.data;
  },
  async approve(id: string, reason?: string) {
    const { data } = await api.post(`/purchase-requests/${id}/approve`, { reason });
    return data.data;
  },
  async reject(id: string, reason: string) {
    const { data } = await api.post(`/purchase-requests/${id}/reject`, { reason });
    return data.data;
  },
  async getHistory(id: string): Promise<HistoryEntry[]> {
    const { data } = await api.get(`/purchase-requests/${id}/history`);
    return data.data;
  },
  async exportCsv(params: ListParams): Promise<Blob> {
    const { data } = await api.get("/purchase-requests/export/csv", { params, responseType: "blob" });
    return data;
  },
};
