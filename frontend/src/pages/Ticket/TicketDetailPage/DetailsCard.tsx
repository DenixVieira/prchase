import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { TicketStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { UserNameTag } from "@/components/shared/UserNameTag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ticketsService } from "@/services/tickets.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { formatDate } from "@/lib/utils";
import { PermissionKey, Priority, Ticket, TicketStatus } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

const STATUS_OPTIONS = [
  { value: TicketStatus.PENDING, label: "Pendente" },
  { value: TicketStatus.IN_PROGRESS, label: "Em andamento" },
  { value: TicketStatus.RESOLVED, label: "Resolvido" },
  { value: TicketStatus.CANCELLED, label: "Cancelado" },
];
const PRIORITY_OPTIONS = [
  { value: Priority.LOW, label: "Baixa" },
  { value: Priority.MEDIUM, label: "Média" },
  { value: Priority.HIGH, label: "Alta" },
  { value: Priority.URGENT, label: "Urgente" },
];

export function DetailsCard({ ticket }: { ticket: Ticket }) {
  const { showToast } = useToast();
  const invalidate = useInvalidateTicket();

  const handleMove = async (status: string) => {
    try {
      await ticketsService.move(ticket.id, status);
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
            <TicketStatusBadge status={ticket.status} />
          ) : (
            <PermissionGate
              permissions={[PermissionKey.MOVE_TICKET, PermissionKey.RESOLVE_TICKET, PermissionKey.CANCEL_TICKET]}
              fallback={<TicketStatusBadge status={ticket.status} />}
            >
              <Select value={ticket.status} onValueChange={handleMove}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
