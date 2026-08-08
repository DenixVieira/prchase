import { api } from "./api";
import { Organization, Attachment, ApiListResponse, PaginationMeta } from "@/types";

export const organizationsService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: Organization[]; meta: PaginationMeta }> {
    const { data } = await api.get<ApiListResponse<Organization>>("/organizations", { params });
    return { items: data.data, meta: data.meta };
  },
  /** Lista simplificada (sem paginação) de organizações ativas, para preencher selects. */
  async listActive(): Promise<Organization[]> {
    const { data } = await api.get("/organizations/active");
    return data.data;
  },
  /** Organizações que o usuário logado pode escolher ao criar uma solicitação de compra. */
  async myAccessible(): Promise<Organization[]> {
    const { data } = await api.get("/organizations/my-accessible");
    return data.data;
  },
  async findOne(id: string): Promise<Organization> {
    const { data } = await api.get(`/organizations/${id}`);
    return data.data;
  },
  async create(payload: { name: string; description?: string }): Promise<Organization> {
    const { data } = await api.post("/organizations", payload);
    return data.data;
  },
  async update(id: string, payload: Record<string, unknown>): Promise<Organization> {
    const { data } = await api.patch(`/organizations/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/organizations/${id}`);
  },
  /** Baixa o ZIP com as notas fiscais da organização no período informado. */
  async exportInvoicesZip(id: string, startDate: string, endDate: string): Promise<Blob> {
    const { data } = await api.get(`/organizations/${id}/export-invoices-zip`, {
      params: { startDate, endDate },
      responseType: "blob",
    });
    return data;
  },
  /** Lista as notas fiscais da organização no período (com data de vencimento), para a aba de consulta. */
  async listInvoices(id: string, startDate: string, endDate: string): Promise<Attachment[]> {
    const { data } = await api.get(`/organizations/${id}/invoices`, { params: { startDate, endDate } });
    return data.data;
  },
};
