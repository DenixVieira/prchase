import { api } from "./api";
import { Notification } from "@/types";

export const notificationsService = {
  async list(onlyUnread = false): Promise<Notification[]> {
    const { data } = await api.get("/notifications", { params: { unread: onlyUnread } });
    return data.data;
  },
  async unreadCount(): Promise<number> {
    const { data } = await api.get("/notifications/unread-count");
    return data.data.count;
  },
  async markAsRead(id: string): Promise<void> {
    await api.post(`/notifications/${id}/read`);
  },
  async markAllAsRead(): Promise<void> {
    await api.post("/notifications/read-all");
  },
  async updatePreference(preference: string): Promise<void> {
    await api.patch("/notifications/preference", { preference });
  },
  async updateMutedTypes(mutedTypes: string[]): Promise<void> {
    await api.patch("/notifications/muted-types", { mutedTypes });
  },
};
