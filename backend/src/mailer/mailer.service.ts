import nodemailer, { Transporter } from "nodemailer";
import { AppDataSource } from "../config/data-source";
import { Setting } from "../database/entities";
import { logger } from "../config/logger";
import { env } from "../config/env";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export class MailerService {
  private settingRepo = AppDataSource.getRepository(Setting);

  async getConfig(): Promise<SmtpConfig> {
    const setting = await this.settingRepo.findOne({ where: { key: "smtp" } });
    if (setting) {
      return setting.value as unknown as SmtpConfig;
    }
    return { ...env.smtpDefaults };
  }

  async saveConfig(config: SmtpConfig): Promise<void> {
    let setting = await this.settingRepo.findOne({ where: { key: "smtp" } });
    if (!setting) {
      setting = this.settingRepo.create({ key: "smtp", value: {} });
    }
    setting.value = config as unknown as Record<string, unknown>;
    await this.settingRepo.save(setting);
  }

  private buildTransporter(config: SmtpConfig): Transporter {
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.password } : undefined,
    });
  }

  async testConnection(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = this.buildTransporter(config);
      await transporter.verify();
      return { success: true, message: "Conexão SMTP estabelecida com sucesso." };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido ao testar conexão SMTP";
      return { success: false, message };
    }
  }

  async sendMail(
    to: string,
    subject: string,
    html: string,
    threading?: { messageId: string; inReplyTo: string; references: string }
  ): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config.host || !config.user) {
        logger.warn("SMTP não configurado; e-mail não enviado.");
        return;
      }
      const transporter = this.buildTransporter(config);
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject,
        html,
        messageId: threading?.messageId,
        inReplyTo: threading?.inReplyTo,
        references: threading?.references,
      });
    } catch (error) {
      logger.error({ error, to, subject }, "Falha ao enviar e-mail");
    }
  }
}

export const mailerService = new MailerService();
