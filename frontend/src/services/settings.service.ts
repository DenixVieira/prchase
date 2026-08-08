import { api } from "./api";
import { SmtpConfig } from "@/types";

export const settingsService = {
  async getSmtp(): Promise<SmtpConfig> {
    const { data } = await api.get("/settings/smtp");
    return data.data;
  },
  async updateSmtp(config: SmtpConfig): Promise<void> {
    await api.put("/settings/smtp", config);
  },
  async testSmtp(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post("/settings/smtp/test", config);
    return data.data;
  },
};
