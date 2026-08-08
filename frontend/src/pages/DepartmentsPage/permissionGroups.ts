import { PermissionKey } from "@/types";

/**
 * Agrupamento apenas visual (não existe no backend) para deixar o modal de
 * permissões navegável à medida que o catálogo cresce. Toda chave nova de
 * PermissionKey que não for listada aqui cai automaticamente em "Outras
 * Permissões", em vez de desaparecer silenciosamente do modal.
 */
export const PERMISSION_GROUPS: { title: string; keys: PermissionKey[] }[] = [
  {
    title: "Permissões de Solicitações e Tickets",
    keys: [
      PermissionKey.CREATE_PURCHASE_REQUEST,
      PermissionKey.EDIT_PURCHASE_REQUEST,
      PermissionKey.CANCEL_PURCHASE_REQUEST,
      PermissionKey.VIEW_PURCHASE_REQUEST,
      PermissionKey.APPROVE_PURCHASE_REQUEST,
      PermissionKey.MOVE_TICKET,
      PermissionKey.RESOLVE_TICKET,
      PermissionKey.CANCEL_TICKET,
      PermissionKey.DELETE_TICKET,
      PermissionKey.COMMENT_TICKET,
      PermissionKey.ATTACH_FILES,
      PermissionKey.VIEW_TICKET,
      PermissionKey.CREATE_TAG,
    ],
  },
  {
    title: "Permissões de Tela",
    keys: [PermissionKey.VIEW_ARCHIVED_TICKETS, PermissionKey.EXPORT_INVOICES],
  },
  {
    title: "Permissões de Equipamentos",
    keys: [
      PermissionKey.VIEW_DEVICE,
      PermissionKey.CREATE_DEVICE,
      PermissionKey.EDIT_DEVICE,
      PermissionKey.DELETE_DEVICE,
      PermissionKey.REGISTER_DEVICE_MAINTENANCE,
    ],
  },
  {
    title: "Permissões Administrativas",
    keys: [
      PermissionKey.MANAGE_USERS,
      PermissionKey.MANAGE_DEPARTMENTS,
      PermissionKey.MANAGE_SETTINGS,
      PermissionKey.SYSTEM_ADMIN,
    ],
  },
];
