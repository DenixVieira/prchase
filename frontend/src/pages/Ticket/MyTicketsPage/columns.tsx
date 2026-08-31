import { DataTableColumn } from "@/components/shared/DataTable";
import { BoardColumnBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { formatDate } from "@/lib/utils";
import { Ticket } from "@/types";

// Somente leitura: quem solicitou acompanha aqui o andamento (coluna atual,
// departamento responsável), sem ações de mover/resolver — isso continua
// sendo feito pelo departamento dono do ticket, no Kanban dele.
export const columns: DataTableColumn<Ticket>[] = [
  { key: "protocol", header: "Protocolo", sortKey: "protocol", render: (row) => <span className="font-mono text-xs">{row.protocol}</span> },
  { key: "title", header: "Título", sortKey: "title", render: (row) => <span className="font-medium">{row.title}</span> },
  { key: "requestType", header: "Tipo", render: (row) => row.requestType?.name ?? "Solicitação de Compra" },
  { key: "department", header: "Departamento", render: (row) => row.department?.name },
  { key: "column", header: "Andamento", render: (row) => <BoardColumnBadge column={row.column} /> },
  { key: "priority", header: "Prioridade", sortKey: "priority", render: (row) => <PriorityBadge priority={row.priority} /> },
  { key: "createdAt", header: "Aberto em", sortKey: "createdAt", render: (row) => formatDate(row.createdAt) },
];
