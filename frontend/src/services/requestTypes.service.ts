import { api } from "./api";
import { RequestType, RequestFieldType, RequestFieldOption } from "@/types";

export interface CreateRequestTypePayload {
  name: string;
  description?: string;
  departmentId: string;
  icon?: string;
  organizationIds?: string[];
  visibleDepartmentIds?: string[];
}

export interface UpdateRequestTypePayload {
  name?: string;
  description?: string;
  departmentId?: string;
  icon?: string;
  isActive?: boolean;
  organizationIds?: string[];
  visibleDepartmentIds?: string[];
}

export interface RequestFieldInput {
  label: string;
  key?: string;
  type: RequestFieldType;
  required?: boolean;
  options?: RequestFieldOption[];
  helpText?: string;
  order?: number;
}

export const requestTypesService = {
  /** Card grid de "Nova Solicitação" — só os tipos ativos. */
  async listActive(): Promise<RequestType[]> {
    const { data } = await api.get("/request-types/active");
    return data.data;
  },
  /** Listagem completa (inclusive inativos), pra tela administrativa. */
  async listAll(): Promise<RequestType[]> {
    const { data } = await api.get("/request-types");
    return data.data;
  },
  async findOne(id: string): Promise<RequestType> {
    const { data } = await api.get(`/request-types/${id}`);
    return data.data;
  },
  async create(payload: CreateRequestTypePayload): Promise<RequestType> {
    const { data } = await api.post("/request-types", payload);
    return data.data;
  },
  async update(id: string, payload: UpdateRequestTypePayload): Promise<RequestType> {
    const { data } = await api.patch(`/request-types/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/request-types/${id}`);
  },
  async replaceFields(id: string, fields: RequestFieldInput[]): Promise<RequestType> {
    const { data } = await api.put(`/request-types/${id}/fields`, { fields });
    return data.data;
  },
};
