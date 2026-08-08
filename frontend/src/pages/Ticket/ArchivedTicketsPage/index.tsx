import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { DataTable } from "@/components/shared/DataTable";
import { ticketsService } from "@/services/tickets.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { daysAgoDateString, todayDateString } from "@/lib/utils";
import { buildColumns } from "./columns";
import { Filters } from "./Filters";

// Filtro inicial nos últimos 5 dias (por data de arquivamento) para não
// carregar o histórico inteiro por padrão — ajustável livremente pelo usuário.
const DEFAULT_RANGE_DAYS = 5;

export default function ArchivedTicketsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(() => daysAgoDateString(DEFAULT_RANGE_DAYS));
  const [endDate, setEndDate] = useState(() => todayDateString());
  const [sortBy, setSortBy] = useState("archivedAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({
      page, limit: 10, search: debouncedSearch || undefined, archived: true,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy, sortOrder,
    }),
    [page, debouncedSearch, startDate, endDate, sortBy, sortOrder]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", "archived", params],
    queryFn: () => ticketsService.list(params),
  });

  const handleUnarchive = async (id: string) => {
    try {
      await ticketsService.unarchive(id);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      showToast({ title: "Ticket desarquivado", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao desarquivar ticket", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const columns = buildColumns(handleUnarchive);

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Kanban", to: "/tickets" }, { label: "Tickets Arquivados" }]} />

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
        emptyTitle="Nenhum ticket arquivado"
        emptyDescription="Tickets arquivados a partir da tela de detalhes aparecerão aqui."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextSortOrder) => { setSortBy(nextSortBy); setSortOrder(nextSortOrder); setPage(1); }}
        filters={
          <Filters
            startDate={startDate}
            onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
            endDate={endDate}
            onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
          />
        }
      />
    </div>
  );
}
