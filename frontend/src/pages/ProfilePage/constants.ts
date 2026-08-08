import { NotificationPreference, NotificationType } from "@/types";

export const PREFERENCE_LABELS: Record<NotificationPreference, string> = {
  [NotificationPreference.EMAIL_ONLY]: "Somente e-mail",
  [NotificationPreference.INTERNAL_ONLY]: "Somente notificações internas",
  [NotificationPreference.BOTH]: "E-mail e notificações internas",
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.NEW_TICKET]: "Novo ticket criado",
  [NotificationType.NEW_COMMENT]: "Novo comentário",
  [NotificationType.NEW_ATTACHMENT]: "Novo anexo",
  [NotificationType.NEW_INVOICE_NOTE]: "Nota fiscal anexada",
  [NotificationType.TICKET_MOVED]: "Movimentação de ticket",
  [NotificationType.TICKET_RESOLVED]: "Ticket resolvido",
  [NotificationType.TICKET_CANCELLED]: "Ticket cancelado",
  [NotificationType.TICKET_REOPENED]: "Ticket reaberto",
  [NotificationType.NEW_FOLLOWER]: "Adicionado como acompanhante",
  [NotificationType.REQUEST_APPROVED]: "Solicitação aprovada",
  [NotificationType.REQUEST_REJECTED]: "Solicitação reprovada",
  [NotificationType.REQUEST_PENDING_APPROVAL]: "Solicitação aguardando aprovação",
};
