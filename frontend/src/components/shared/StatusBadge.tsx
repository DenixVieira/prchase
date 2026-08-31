import { Badge } from "@/components/ui/badge";
import { PurchaseRequestStatus, BoardColumn } from "@/types";

const PURCHASE_REQUEST_LABELS: Record<PurchaseRequestStatus, { label: string; variant: "secondary" | "warning" | "success" | "destructive" }> = {
  [PurchaseRequestStatus.DRAFT]: { label: "Rascunho", variant: "secondary" },
  [PurchaseRequestStatus.PENDING_APPROVAL]: { label: "Aguardando Aprovação", variant: "warning" },
  [PurchaseRequestStatus.APPROVED]: { label: "Aprovada", variant: "success" },
  [PurchaseRequestStatus.REJECTED]: { label: "Reprovada", variant: "destructive" },
  [PurchaseRequestStatus.CANCELLED]: { label: "Cancelada", variant: "secondary" },
};

export function PurchaseRequestStatusBadge({ status }: { status: PurchaseRequestStatus }) {
  const config = PURCHASE_REQUEST_LABELS[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Substitui o antigo TicketStatusBadge (mapa fixo por enum): a coluna do
 * board agora é configurável por departamento, então nome/cor vêm direto da
 * BoardColumn do próprio ticket, sem lista fixa de status.
 */
export function BoardColumnBadge({ column }: { column: BoardColumn | null | undefined }) {
  if (!column) return <Badge variant="secondary">—</Badge>;
  return (
    <Badge
      variant="outline"
      className="border-transparent text-white"
      style={{ backgroundColor: column.color }}
    >
      {column.name}
    </Badge>
  );
}
