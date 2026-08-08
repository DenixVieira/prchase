import { api } from "./api";
import { User, ApiListResponse, ApiResponse, PaginationMeta } from "@/types";

export interface UserOption {
  id: string;
  name: string;
  login: string;
  department: { id: string; name: string } | null;
}

export const usersService = {
  /**
   * Busca leve de usuários para pickers (atribuir responsável, adicionar
   * acompanhante). Não exige permissão administrativa — qualquer usuário
   * autenticado pode chamar.
   */
  async search(params: { search?: string; limit?: number }): Promise<UserOption[]> {
    const { data } = await api.get<ApiResponse<UserOption[]>>("/users/search", { params });
    return data.data;
  },
  async list(params: Record<string, unknown>): Promise<{ items: User[]; meta: PaginationMeta }> {
    const { data } = await api.get<ApiListResponse<User>>("/users", { params });
    return { items: data.data, meta: data.meta };
  },
  async findOne(id: string): Promise<User> {
    const { data } = await api.get(`/users/${id}`);
    return data.data;
  },
  async create(payload: Record<string, unknown>): Promise<User> {
    const { data } = await api.post("/users", payload);
    return data.data;
  },
  async update(id: string, payload: Record<string, unknown>): Promise<User> {
    const { data } = await api.patch(`/users/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
  async block(id: string): Promise<User> {
    const { data } = await api.post(`/users/${id}/block`);
    return data.data;
  },
  async unblock(id: string): Promise<User> {
    const { data } = await api.post(`/users/${id}/unblock`);
    return data.data;
  },
  async resetPassword(id: string, newPassword: string): Promise<void> {
    await api.post(`/users/${id}/reset-password`, { newPassword });
  },
  async changeDepartment(id: string, departmentId: string): Promise<User> {
    const { data } = await api.post(`/users/${id}/change-department`, { departmentId });
    return data.data;
  },
};
