import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { DataTable } from "@/components/shared/DataTable";
import { ticketsService } from "@/services/tickets.service";
import { useDebounce } from "@/hooks/useDebounce";
import { columns } from "./columns";

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({ page, limit: 10, search: debouncedSearch || undefined, mine: true, sortBy, sortOrder }),
    [page, debouncedSearch, sortBy, sortOrder]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", "mine", params],
    queryFn: () => ticketsService.list(params),
  });

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Meus Tickets" }]} />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        meta={data?.meta}
        page={page}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        isLoading={isLoading}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/tickets/${row.id}`)}
        emptyTitle="Nenhum ticket encontrado"
        emptyDescription="Tickets criados a partir de solicitações aprovadas com você como solicitante aparecem aqui."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextSortOrder) => { setSortBy(nextSortBy); setSortOrder(nextSortOrder); setPage(1); }}
      />
    </div>
  );
}
