import { useNavigate } from "react-router-dom";
import { ExternalLink, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ticketsService } from "@/services/tickets.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { PermissionKey, Ticket } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

export function HeaderCard({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const invalidate = useInvalidateTicket();

  const handleArchive = async () => {
    try {
      await ticketsService.archive(ticket.id);
      invalidate();
      showToast({ title: "Ticket arquivado", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao arquivar ticket", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleUnarchive = async () => {
    try {
      await ticketsService.unarchive(ticket.id);
      invalidate();
      showToast({ title: "Ticket desarquivado", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao desarquivar ticket", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await ticketsService.remove(ticket.id);
      invalidate();
      showToast({ title: "Ticket excluído", variant: "success" });
      navigate("/tickets");
    } catch (error) {
      showToast({ title: "Erro ao excluir ticket", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{ticket.protocol}</span>
            {ticket.isArchived && <Badge variant="secondary">Arquivado</Badge>}
          </div>
          {ticket.purchaseRequestId && (
            <a href={`/purchase-requests/${ticket.purchaseRequestId}`} className="text-xs flex items-center gap-1 text-primary hover:underline">
              Ver solicitação de origem <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{ticket.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            <PermissionGate permissions={[PermissionKey.MOVE_TICKET]}>
              {ticket.isArchived ? (
                <Button size="sm" variant="outline" onClick={handleUnarchive}>
                  <ArchiveRestore className="h-4 w-4" /> Desarquivar
                </Button>
              ) : (
                // Só pode arquivar ticket já numa coluna terminal (isDone ou
                // isCancelled) — nada em andamento deveria sumir do fluxo
                // ativo do Kanban.
                (ticket.column?.isDone || ticket.column?.isCancelled) && (
                  <Button size="sm" variant="outline" onClick={handleArchive}>
                    <Archive className="h-4 w-4" /> Arquivar
                  </Button>
                )
              )}
            </PermissionGate>
            <PermissionGate permissions={[PermissionKey.DELETE_TICKET]}>
              <ConfirmDialog
                trigger={
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4" /> Excluir
                  </Button>
                }
                title="Excluir ticket"
                description={`Tem certeza que deseja excluir o ticket ${ticket.protocol}? Esta ação não pode ser desfeita pela interface.`}
                confirmLabel="Excluir"
                variant="destructive"
                onConfirm={handleDelete}
              />
            </PermissionGate>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{ticket.description}</p>
      </CardHeader>
    </Card>
  );
}
