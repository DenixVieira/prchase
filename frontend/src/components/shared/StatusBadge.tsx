import { Badge } from "@/components/ui/badge";
import { PurchaseRequestStatus, TicketStatus } from "@/types";

const PURCHASE_REQUEST_LABELS: Record<PurchaseRequestStatus, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  [PurchaseRequestStatus.DRAFT]: { label: "Rascunho", variant: "secondary" },
  [PurchaseRequestStatus.PENDING_APPROVAL]: { label: "Aguardando Aprovação", variant: "warning" },
  [PurchaseRequestStatus.APPROVED]: { label: "Aprovada", variant: "success" },
  [PurchaseRequestStatus.REJECTED]: { label: "Reprovada", variant: "destructive" },
  [PurchaseRequestStatus.CANCELLED]: { label: "Cancelada", variant: "secondary" },
};

const TICKET_LABELS: Record<TicketStatus, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  [TicketStatus.PENDING]: { label: "Pendente", variant: "secondary" },
  [TicketStatus.IN_PROGRESS]: { label: "Em andamento", variant: "warning" },
  [TicketStatus.RESOLVED]: { label: "Resolvido", variant: "success" },
  [TicketStatus.CANCELLED]: { label: "Cancelado", variant: "destructive" },
};

export function PurchaseRequestStatusBadge({ status }: { status: PurchaseRequestStatus }) {
  const config = PURCHASE_REQUEST_LABELS[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = TICKET_LABELS[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
