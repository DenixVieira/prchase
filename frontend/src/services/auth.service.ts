import { api } from "./api";
import { AuthUser } from "@/types";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authService = {
  async login(login: string, password: string): Promise<LoginResult> {
    const { data } = await api.post("/auth/login", { login, password });
    return data.data;
  },
  async me(): Promise<AuthUser> {
    const { data } = await api.get("/auth/me");
    return data.data;
  },
  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post("/auth/change-password", { currentPassword, newPassword });
  },
  async changeEmail(currentPassword: string, newEmail: string): Promise<AuthUser> {
    const { data } = await api.post("/auth/change-email", { currentPassword, newEmail });
    return data.data;
  },
};
