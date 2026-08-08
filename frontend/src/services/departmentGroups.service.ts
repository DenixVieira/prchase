import { api } from "./api";
import { DepartmentGroup } from "@/types";

export const departmentGroupsService = {
  async list(): Promise<DepartmentGroup[]> {
    const { data } = await api.get("/department-groups");
    return data.data;
  },
  async create(payload: { name: string; organizationId?: string }): Promise<DepartmentGroup> {
    const { data } = await api.post("/department-groups", payload);
    return data.data;
  },
  async update(id: string, payload: { name?: string; organizationId?: string }): Promise<DepartmentGroup> {
    const { data } = await api.patch(`/department-groups/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/department-groups/${id}`);
  },
};
