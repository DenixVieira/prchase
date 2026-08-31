import { api } from "./api";
import { Ticket, Comment, HistoryEntry, ApiListResponse, PaginationMeta } from "@/types";

export interface TicketListParams {
  page?: number;
  limit?: number;
  search?: string;
  columnId?: string;
  priority?: string;
  departmentId?: string;
  organizationId?: string;
  requestTypeId?: string;
  assigneeId?: string;
  unassigned?: boolean;
  /** Só tickets em que o usuário autenticado é o solicitante, cruzando departamentos. */
  mine?: boolean;
  board?: boolean;
  /** Só vale com board=true — teto de itens carregados por coluna (padrão 50 no backend). */
  columnLimit?: number;
  archived?: boolean;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export const ticketsService = {
  async list(params: TicketListParams): Promise<{ items: Ticket[]; meta: PaginationMeta }> {
    const { data } = await api.get<ApiListResponse<Ticket>>("/tickets", { params });
    return { items: data.data, meta: data.meta };
  },
  async findOne(id: string): Promise<Ticket> {
    const { data } = await api.get(`/tickets/${id}`);
    return data.data;
  },
  async update(id: string, payload: { title?: string; description?: string }): Promise<Ticket> {
    const { data } = await api.patch(`/tickets/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/tickets/${id}`);
  },
  async move(id: string, columnId: string): Promise<Ticket> {
    const { data } = await api.post(`/tickets/${id}/move`, { columnId });
    return data.data;
  },
  async assign(id: string, assigneeId: string): Promise<Ticket> {
    const { data } = await api.post(`/tickets/${id}/assign`, { assigneeId });
    return data.data;
  },
  async changePriority(id: string, priority: string): Promise<Ticket> {
    const { data } = await api.post(`/tickets/${id}/priority`, { priority });
    return data.data;
  },
  async archive(id: string): Promise<Ticket> {
    const { data } = await api.post(`/tickets/${id}/archive`);
    return data.data;
  },
  async unarchive(id: string): Promise<Ticket> {
    const { data } = await api.post(`/tickets/${id}/unarchive`);
    return data.data;
  },
  async getComments(id: string): Promise<Comment[]> {
    const { data } = await api.get(`/tickets/${id}/comments`);
    return data.data;
  },
  async addComment(id: string, content: string): Promise<Comment> {
    const { data } = await api.post(`/tickets/${id}/comments`, { content });
    return data.data;
  },
  async getHistory(id: string): Promise<HistoryEntry[]> {
    const { data } = await api.get(`/tickets/${id}/history`);
    return data.data;
  },
  async addFollower(id: string, userId: string) {
    await api.post(`/tickets/${id}/followers`, { userId });
  },
  async removeFollower(id: string, userId: string) {
    await api.delete(`/tickets/${id}/followers/${userId}`);
  },
  async uploadAttachment(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    // Não definir Content-Type manualmente: o axios detecta o FormData e gera
    // automaticamente o header correto com o boundary do multipart.
    const { data } = await api.post(`/tickets/${id}/attachments`, formData);
    return data.data;
  },
  async uploadInvoiceAttachment(id: string, file: File, dueDate: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dueDate", dueDate);
    const { data } = await api.post(`/tickets/${id}/attachments/invoice`, formData);
    return data.data;
  },
  // Baixa o anexo autenticado (a rota exige Bearer token, então não pode ser
  // um simples link <a href>; o axios já injeta o token via interceptor).
  async downloadAttachment(ticketId: string, attachmentId: string): Promise<Blob> {
    const { data } = await api.get(`/tickets/${ticketId}/attachments/${attachmentId}/download`, {
      responseType: "blob",
    });
    return data;
  },
  // Mesma ideia do download, mas para pré-visualização em modal: o backend
  // serve o arquivo com Content-Disposition: inline em vez de forçar o download.
  async viewAttachment(ticketId: string, attachmentId: string): Promise<Blob> {
    const { data } = await api.get(`/tickets/${ticketId}/attachments/${attachmentId}/view`, {
      responseType: "blob",
    });
    return data;
  },
  async removeAttachment(ticketId: string, attachmentId: string): Promise<void> {
    await api.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
  },
  async addTag(id: string, tagId: string): Promise<Ticket> {
    const { data } = await api.post(`/tickets/${id}/tags`, { tagId });
    return data.data;
  },
  async removeTag(id: string, tagId: string): Promise<Ticket> {
    const { data } = await api.delete(`/tickets/${id}/tags/${tagId}`);
    return data.data;
  },
  async exportCsv(params: TicketListParams): Promise<Blob> {
    const { data } = await api.get("/tickets/export/csv", { params, responseType: "blob" });
    return data;
  },
  // Busca rápida da barra de pesquisa do Navbar (protocolo/título) — o
  // backend já restringe aos tickets que o usuário tem acesso (ver
  // ticketsService.quickSearch).
  async quickSearch(q: string): Promise<Ticket[]> {
    const { data } = await api.get("/tickets/search", { params: { q } });
    return data.data;
  },
};
