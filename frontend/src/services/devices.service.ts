import { api } from "./api";
import { Device, ApiListResponse, PaginationMeta } from "@/types";

export interface DeviceListParams {
  page?: number;
  limit?: number;
  search?: string;
  organizationId?: string;
  departmentId?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface DeviceFormPayload {
  name?: string;
  serialNumber: string;
  mac?: string;
  model: string;
  brand: string;
  purchaseDate: string;
  warrantyExpiration: string;
  organizationId: string;
  departmentId: string;
  assignedToName?: string;
}

export const devicesService = {
  async list(params: DeviceListParams): Promise<{ items: Device[]; meta: PaginationMeta }> {
    const { data } = await api.get<ApiListResponse<Device>>("/devices", { params });
    return { items: data.data, meta: data.meta };
  },
  async findOne(id: string): Promise<Device> {
    const { data } = await api.get(`/devices/${id}`);
    return data.data;
  },
  async create(payload: DeviceFormPayload): Promise<Device> {
    const { data } = await api.post("/devices", payload);
    return data.data;
  },
  async update(id: string, payload: Partial<DeviceFormPayload>): Promise<Device> {
    const { data } = await api.patch(`/devices/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await api.delete(`/devices/${id}`);
  },
  async addMaintenance(id: string, payload: { sentDate: string; returnDate?: string; reason: string }): Promise<Device> {
    const { data } = await api.post(`/devices/${id}/maintenances`, payload);
    return data.data;
  },
  async uploadAttachment(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post(`/devices/${id}/attachments`, formData);
    return data.data;
  },
  async downloadAttachment(deviceId: string, attachmentId: string): Promise<Blob> {
    const { data } = await api.get(`/devices/${deviceId}/attachments/${attachmentId}/download`, { responseType: "blob" });
    return data;
  },
  async viewAttachment(deviceId: string, attachmentId: string): Promise<Blob> {
    const { data } = await api.get(`/devices/${deviceId}/attachments/${attachmentId}/view`, { responseType: "blob" });
    return data;
  },
  async removeAttachment(deviceId: string, attachmentId: string): Promise<void> {
    await api.delete(`/devices/${deviceId}/attachments/${attachmentId}`);
  },
};
