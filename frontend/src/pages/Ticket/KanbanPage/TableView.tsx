import { useNavigate } from "react-router-dom";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { BoardColumnBadge } from "@/components/shared/StatusBadge";
import { UserNameTag } from "@/components/shared/UserNameTag";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";
import { formatDateOnly } from "@/lib/utils";
import { PaginationMeta, Ticket } from "@/types";

const tableColumns: DataTableColumn<Ticket>[] = [
  { key: "protocol", header: "Protocolo", sortKey: "protocol", render: (row) => <span className="font-mono text-xs">{row.protocol}</span> },
  { key: "title", header: "Título", sortKey: "title", render: (row) => <span className="font-medium">{row.title}</span> },
  { key: "requestType", header: "Tipo", render: (row) => row.requestType?.name ?? "Solicitação de Compra" },
  { key: "department", header: "Departamento", render: (row) => row.department?.name },
  { key: "organization", header: "Organização", render: (row) => row.organization?.name ?? "—" },
  { key: "assignee", header: "Responsável", render: (row) => (row.assignee ? <UserNameTag user={row.assignee} /> : <span className="text-muted-foreground">Não atribuído</span>) },
  { key: "priority", header: "Prioridade", sortKey: "priority", render: (row) => <PriorityBadge priority={row.priority} /> },
  // Sem sortKey: coluna do board não é mais uma coluna simples do Ticket (é
  // FK pra uma BoardColumn configurável), o backend não a expõe pra ORDER BY.
  { key: "column", header: "Coluna", render: (row) => <BoardColumnBadge column={row.column} /> },
  { key: "date", header: "Criado em", sortKey: "createdAt", render: (row) => formatDateOnly(row.createdAt) },
];

interface TableViewProps {
  data?: { items: Ticket[]; meta: PaginationMeta };
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (search: string) => void;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
  onSortChange: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
}

export function TableView({ data, isLoading, page, onPageChange, search, onSearchChange, sortBy, sortOrder, onSortChange }: TableViewProps) {
  const navigate = useNavigate();

  return (
    <DataTable
      columns={tableColumns}
      data={data?.items ?? []}
      meta={data?.meta}
      page={page}
      onPageChange={onPageChange}
      search={search}
      onSearchChange={onSearchChange}
      isLoading={isLoading}
      rowKey={(row) => row.id}
      onRowClick={(row) => navigate(`/tickets/${row.id}`)}
      emptyTitle="Nenhum ticket encontrado"
      sortBy={sortBy}
      sortOrder={sortOrder}
      onSortChange={onSortChange}
    />
  );
}
