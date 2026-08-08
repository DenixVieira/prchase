import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { ticketsService } from "@/services/tickets.service";
import { usersService } from "@/services/users.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { initials } from "@/lib/utils";
import { PermissionKey, Ticket } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

export function AssigneeCard({ ticket }: { ticket: Ticket }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTicket();

  const handleAssign = async (assigneeId: string) => {
    try {
      const updated = await ticketsService.assign(ticket.id, assigneeId);
      // Atualiza o cache diretamente com o ticket retornado, garantindo que os
      // Detalhes reflitam o novo responsável de imediato, sem depender do
      // timing do refetch disparado por invalidate().
      queryClient.setQueryData(["tickets", ticket.id], updated);
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao atribuir responsável", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  if (ticket.isArchived) return null;

  return (
    <PermissionGate permissions={[PermissionKey.MOVE_TICKET]}>
      <Card>
        <CardHeader><CardTitle className="text-base">Atribuir Responsável</CardTitle></CardHeader>
        <CardContent>
          <FollowerPicker onSelect={handleAssign} placeholder="Buscar usuário..." />
        </CardContent>
      </Card>
    </PermissionGate>
  );
}

function FollowerPicker({ onSelect, placeholder }: { onSelect: (userId: string) => void; placeholder: string }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const { data } = useQuery({ queryKey: ["users", "picker", debounced], queryFn: () => usersService.search({ search: debounced, limit: 8 }) });

  return (
    <div className="space-y-2">
      <Input placeholder={placeholder} value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {(data ?? []).map((u) => (
          <button key={u.id} className="flex w-full items-center gap-2 rounded-md p-1.5 text-sm hover:bg-accent" onClick={() => onSelect(u.id)}>
            <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback></Avatar>
            {u.name}
          </button>
        ))}
      </div>
    </div>
  );
}
