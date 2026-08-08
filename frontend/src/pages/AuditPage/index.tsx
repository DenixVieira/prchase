import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { DataTable } from "@/components/shared/DataTable";
import { auditService } from "@/services/audit.service";
import { useDebounce } from "@/hooks/useDebounce";
import { downloadCsvBlob, daysAgoDateString, todayDateString } from "@/lib/utils";
import { columns } from "./columns";
import { Filters } from "./Filters";

// Logs de auditoria crescem indefinidamente — sem filtro de período por
// padrão, a listagem consultaria o histórico inteiro a cada carregamento.
const DEFAULT_RANGE_DAYS = 5;

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => daysAgoDateString(DEFAULT_RANGE_DAYS));
  const [dateTo, setDateTo] = useState(() => todayDateString());
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const debouncedSearch = useDebounce(search);

  const params = useMemo(
    () => ({
      page, limit: 10, action: action !== "all" ? action : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy, sortOrder,
    }),
    [page, action, dateFrom, dateTo, sortBy, sortOrder]
  );
  const { data, isLoading } = useQuery({ queryKey: ["audit", params], queryFn: () => auditService.list(params) });

  const filteredItems = (data?.items ?? []).filter((log) =>
    !debouncedSearch || log.entity.toLowerCase().includes(debouncedSearch.toLowerCase()) || log.user?.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const handleExport = async () => {
    const blob = await auditService.exportCsv();
    downloadCsvBlob(blob, "auditoria.csv");
  };

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Auditoria" }]} />
      <DataTable
        columns={columns}
        data={filteredItems}
        meta={data?.meta}
        page={page}
        onPageChange={setPage}
        search={search}
        onSearchChange={setSearch}
        isLoading={isLoading}
        onExportCsv={handleExport}
        rowKey={(log) => log.id}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextSortOrder) => { setSortBy(nextSortBy); setSortOrder(nextSortOrder); setPage(1); }}
        filters={
          <Filters
            dateFrom={dateFrom}
            onDateFromChange={(v) => { setDateFrom(v); setPage(1); }}
            dateTo={dateTo}
            onDateToChange={(v) => { setDateTo(v); setPage(1); }}
            action={action}
            onActionChange={(v) => { setAction(v); setPage(1); }}
          />
        }
      />
    </div>
  );
}
