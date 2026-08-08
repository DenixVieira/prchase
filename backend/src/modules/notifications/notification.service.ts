import { LessThan } from "typeorm";
import { AppDataSource } from "../../config/data-source";
import { Notification, NotificationType, NotificationPreference, User } from "../../database/entities";
import { emitToUser, SOCKET_EVENTS } from "../../sockets/socket";
import { mailerService } from "../../mailer/mailer.service";
import { logger } from "../../config/logger";
import { env } from "../../config/env";

/** Retenção das notificações: 1 mês. Registros mais antigos são purgados
 * automaticamente (ver purgeExpiredNotifications, chamado no bootstrap do
 * servidor e periodicamente a cada 24h) — mesmo padrão usado nos logs de
 * auditoria, pra não acumular indefinidamente. */
const NOTIFICATION_RETENTION_MONTHS = 1;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  relatedTicketId?: string;
  relatedPurchaseRequestId?: string;
}

export class NotificationService {
  private repo = AppDataSource.getRepository(Notification);
  private userRepo = AppDataSource.getRepository(User);

  async notify(params: NotifyParams): Promise<Notification | null> {
    const user = await this.userRepo.findOne({ where: { id: params.userId } });
    if (!user) return null;

    if (user.mutedNotificationTypes?.includes(params.type)) {
      // Usuário optou por não receber este tipo de notificação — não gera registro nem envio.
      return null;
    }

    const notification = await this.repo.save(
      this.repo.create({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link ?? null,
        relatedTicketId: params.relatedTicketId ?? null,
        relatedPurchaseRequestId: params.relatedPurchaseRequestId ?? null,
      })
    );

    const sendInternal =
      user.notificationPreference === NotificationPreference.INTERNAL_ONLY ||
      user.notificationPreference === NotificationPreference.BOTH;
    const sendEmail =
      user.notificationPreference === NotificationPreference.EMAIL_ONLY ||
      user.notificationPreference === NotificationPreference.BOTH;

    if (sendInternal) {
      emitToUser(user.id, SOCKET_EVENTS.NOTIFICATION_NEW, notification);
    }

    if (sendEmail) {
      // Diferente do link salvo na notificação (relativo, resolvido pelo
      // próprio front), o e-mail não tem uma origem implícita — precisa da
      // URL absoluta (env.appUrl) para o botão realmente abrir o sistema.
      const absoluteLink = params.link ? `${env.appUrl}${params.link}` : null;
      // title/message podem carregar texto digitado por usuário (conteúdo de
      // comentário, título de ticket) — escapa antes de embutir no HTML do
      // e-mail para não permitir injeção de markup/tags.
      const safeTitle = escapeHtml(params.title);
      const safeMessage = escapeHtml(params.message);
      mailerService
        .sendMail(
          user.email,
          params.title,
          `<div style="font-family:sans-serif"><h2>${safeTitle}</h2><p>${safeMessage}</p>${
            absoluteLink ? `<p><a href="${absoluteLink}">Acessar no sistema</a></p>` : ""
          }</div>`,
          this.buildThreading(notification.id, params)
        )
        .catch((error) => logger.error({ error }, "Erro ao enviar e-mail de notificação"));
    }

    return notification;
  }

  /**
   * Todas as notificações do mesmo ticket/solicitação usam o mesmo
   * In-Reply-To/References ("âncora"), mesmo que essa mensagem-âncora nunca
   * tenha sido enviada de fato — é o suficiente para Gmail, Outlook e Apple
   * Mail agruparem os e-mails como uma única conversa na caixa de entrada.
   */
  private buildThreading(
    notificationId: string,
    params: Pick<NotifyParams, "relatedTicketId" | "relatedPurchaseRequestId">
  ): { messageId: string; inReplyTo: string; references: string } | undefined {
    const threadKey = params.relatedTicketId
      ? `ticket-${params.relatedTicketId}`
      : params.relatedPurchaseRequestId
        ? `purchase-request-${params.relatedPurchaseRequestId}`
        : null;
    if (!threadKey) return undefined;

    const anchor = `<${threadKey}@purchase-system.local>`;
    return {
      messageId: `<notification-${notificationId}@purchase-system.local>`,
      inReplyTo: anchor,
      references: anchor,
    };
  }

  async notifyMany(userIds: string[], params: Omit<NotifyParams, "userId">): Promise<void> {
    const uniqueIds = Array.from(new Set(userIds));
    await Promise.all(uniqueIds.map((userId) => this.notify({ ...params, userId })));
  }

  async listForUser(userId: string, onlyUnread: boolean) {
    return this.repo.find({
      where: onlyUnread ? { userId, isRead: false } : { userId },
      order: { createdAt: "DESC" },
      take: 100,
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.repo.update({ id: notificationId, userId }, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async updatePreference(userId: string, preference: NotificationPreference): Promise<void> {
    await this.userRepo.update(userId, { notificationPreference: preference });
  }

  async updateMutedTypes(userId: string, mutedTypes: NotificationType[]): Promise<void> {
    await this.userRepo.update(userId, { mutedNotificationTypes: mutedTypes });
  }

  /**
   * Remove notificações com mais de NOTIFICATION_RETENTION_MONTHS (1 mês),
   * lidas ou não. Executado no boot do servidor e depois a cada 24h (ver
   * server.ts), garantindo que a tabela não cresça indefinidamente.
   */
  async purgeExpiredNotifications(): Promise<number> {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - NOTIFICATION_RETENTION_MONTHS);

    const result = await this.repo.delete({ createdAt: LessThan(threshold) });
    const removed = result.affected ?? 0;
    if (removed > 0) {
      logger.info({ removed, threshold }, `Retenção de notificações: ${removed} notificação(ões) com mais de ${NOTIFICATION_RETENTION_MONTHS} mês(es) removida(s).`);
    }
    return removed;
  }
}

export const notificationService = new NotificationService();
