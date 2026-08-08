import { FileClock, FileCheck2, FileX2, ListTodo, CheckCircle2, XCircle, Clock, Wallet, BadgeDollarSign, CircleDollarSign } from "lucide-react";

export const CARD_CONFIG = [
  { key: "pendingRequests", label: "Solicitações Pendentes", icon: FileClock, color: "text-warning" },
  { key: "approvedRequests", label: "Solicitações Aprovadas", icon: FileCheck2, color: "text-success" },
  { key: "rejectedRequests", label: "Solicitações Reprovadas", icon: FileX2, color: "text-destructive" },
  { key: "pendingTickets", label: "Tickets Pendentes", icon: ListTodo, color: "text-muted-foreground" },
  { key: "inProgressTickets", label: "Tickets Em Andamento", icon: Clock, color: "text-warning" },
  { key: "resolvedTickets", label: "Tickets Resolvidos", icon: CheckCircle2, color: "text-success" },
  { key: "cancelledTickets", label: "Tickets Cancelados", icon: XCircle, color: "text-destructive" },
] as const;

export const VALUE_CARD_CONFIG = [
  { key: "approvedValue", label: "Valor Total Aprovado", icon: BadgeDollarSign, color: "text-success", accent: "border-t-emerald-400" },
  { key: "rejectedValue", label: "Valor Total Reprovado", icon: CircleDollarSign, color: "text-destructive", accent: "border-t-red-400" },
  { key: "pendingApprovalValue", label: "Valor em Processo (Aguardando Aprovação)", icon: Wallet, color: "text-warning", accent: "border-t-amber-400" },
] as const;
