import { TicketStatus } from "@/types";

export const COLUMNS: { status: TicketStatus; label: string; accent: string }[] = [
  { status: TicketStatus.PENDING, label: "Pendente", accent: "border-t-slate-400" },
  { status: TicketStatus.IN_PROGRESS, label: "Em andamento", accent: "border-t-amber-400" },
  { status: TicketStatus.RESOLVED, label: "Resolvido", accent: "border-t-emerald-400" },
  { status: TicketStatus.CANCELLED, label: "Cancelado", accent: "border-t-red-400" },
];
