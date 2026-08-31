import { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { BoardColumnBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { UserNameTag } from "@/components/shared/UserNameTag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ticketsService } from "@/services/tickets.service";
import { boardsService } from "@/services/boardsService";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { formatDate } from "@/lib/utils";
import { PermissionKey, Priority, Ticket } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

const PRIORITY_OPTIONS = [
  { value: Priority.LOW, label: "Baixa" },
  { value: Priority.MEDIUM, label: "Média" },
  { value: Priority.HIGH, label: "Alta" },
  { value: Priority.URGENT, label: "Urgente" },
];

export function DetailsCard({ ticket }: { ticket: Ticket }) {
  const { showToast } = useToast();
  const invalidate = useInvalidateTicket();

  // Colunas do board do próprio departamento do ticket — substitui a lista
  // fixa de status; só é buscado quando de fato vai ser exibido (ticket
  // ativo com permissão de mover).
  const { data: board } = useQuery({
    queryKey: ["boards", "department", ticket.department.id],
    queryFn: () => boardsService.getForDepartment(ticket.department.id),
    enabled: !ticket.isArchived,
  });
  const columnOptions = [...(board?.columns ?? [])].sort((a, b) => a.order - b.order);

  const handleMove = async (columnId: string) => {
    try {
      await ticketsService.move(ticket.id, columnId);
      invalidate();
      showToast({ title: "Ticket atualizado", variant: "success" });
    } catch (error) {
      showToast({ title: "Não foi possível mover o ticket", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handlePriority = async (priority: string) => {
    try {
      await ticketsService.changePriority(ticket.id, priority);
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao alterar prioridade", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          {ticket.isArchived ? (
            <BoardColumnBadge column={ticket.column} />
          ) : (
            <PermissionGate
              permissions={[PermissionKey.MOVE_TICKET, PermissionKey.RESOLVE_TICKET, PermissionKey.CANCEL_TICKET]}
              fallback={<BoardColumnBadge column={ticket.column} />}
            >
              <Select value={ticket.columnId} onValueChange={handleMove}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {columnOptions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </PermissionGate>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Prioridade</p>
          {ticket.isArchived ? (
            <PriorityBadge priority={ticket.priority} />
          ) : (
            <PermissionGate permissions={[PermissionKey.MOVE_TICKET]} fallback={<PriorityBadge priority={ticket.priority} />}>
              <Select value={ticket.priority} onValueChange={handlePriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </PermissionGate>
          )}
        </div>
        <Info label="Departamento" value={ticket.department?.name} />
        <Info label="Organização" value={ticket.organization?.name} />
        <Info label="Solicitante" value={<UserNameTag user={ticket.requester} />} />
        <Info label="Responsável" value={ticket.assignee ? <UserNameTag user={ticket.assignee} /> : "Não atribuído"} />
        <Info label="Criado em" value={formatDate(ticket.createdAt)} />
        <Info label="Atualizado em" value={formatDate(ticket.updatedAt)} />
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}
