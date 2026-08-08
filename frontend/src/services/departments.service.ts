import { api } from "./api";
import { Department, PermissionKey, ApiListResponse, PaginationMeta } from "@/types";

export const departmentsService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: Department[]; meta: PaginationMeta }> {
    const { data } = await api.get<ApiListResponse<Department>>("/departments", { params });
    return { items: data.data, meta: data.meta };
  },
  /** Lista simplificada (sem paginação), liberada a qualquer usuário autenticado —
   * usada para preencher selects/filtros fora das telas administrativas. */
  async listActive(): Promise<Department[]> {
    const { data } = await api.get("/departments/active");
    return data.data;
  },
  async findOne(id: string): Promise<Department> {
    const { data } = await api.get(`/departments/${id}`);
    return data.data;
  },
  async create(payload: Record<string, unknown>): Promise<Department> {
    const { data } = await api.post("/departments", payload);
    return data.data;
  },
  async update(id: string, payload: Record<string, unknown>): Promise<Department> {
    const { data } = await api.patch(`/departments/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/departments/${id}`);
  },
  async updatePermissions(id: string, permissionKeys: PermissionKey[]): Promise<Department> {
    const { data } = await api.put(`/departments/${id}/permissions`, { permissionKeys });
    return data.data;
  },
  async listAllPermissions(): Promise<{ id: string; key: PermissionKey; description: string }[]> {
    const { data } = await api.get("/departments/permissions/catalog");
    return data.data;
  },
};
