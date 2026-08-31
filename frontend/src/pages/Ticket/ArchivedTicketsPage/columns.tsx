import { ArchiveRestore } from "lucide-react";
import { DataTableColumn } from "@/components/shared/DataTable";
import { BoardColumnBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { PermissionKey, Ticket } from "@/types";

export function buildColumns(onUnarchive: (id: string) => void): DataTableColumn<Ticket>[] {
  return [
    { key: "protocol", header: "Protocolo", sortKey: "protocol", render: (row) => <span className="font-mono text-xs">{row.protocol}</span> },
    { key: "title", header: "Título", sortKey: "title", render: (row) => <span className="font-medium">{row.title}</span> },
    { key: "requestType", header: "Tipo", render: (row) => row.requestType?.name ?? "Solicitação de Compra" },
    { key: "department", header: "Departamento", render: (row) => row.department?.name },
    { key: "organization", header: "Organização", render: (row) => row.organization?.name ?? "—" },
    { key: "column", header: "Coluna", render: (row) => <BoardColumnBadge column={row.column} /> },
    { key: "priority", header: "Prioridade", sortKey: "priority", render: (row) => <PriorityBadge priority={row.priority} /> },
    { key: "archivedAt", header: "Arquivado em", sortKey: "archivedAt", render: (row) => (row.archivedAt ? formatDate(row.archivedAt) : "—") },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (row) => (
        <PermissionGate permissions={[PermissionKey.MOVE_TICKET]}>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => { e.stopPropagation(); onUnarchive(row.id); }}
          >
            <ArchiveRestore className="h-4 w-4" /> Desarquivar
          </Button>
        </PermissionGate>
      ),
    },
  ];
}
