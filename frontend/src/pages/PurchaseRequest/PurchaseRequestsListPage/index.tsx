import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { DataTable } from "@/components/shared/DataTable";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { Button } from "@/components/ui/button";
import { purchaseRequestsService } from "@/services/purchaseRequests.service";
import { departmentsService } from "@/services/departments.service";
import { organizationsService } from "@/services/organizations.service";
import { useDebounce } from "@/hooks/useDebounce";
import { isHomeOrganization } from "@/lib/departmentOrganization";
import { PermissionKey } from "@/types";
import { downloadCsvBlob, daysAgoDateString, todayDateString } from "@/lib/utils";
import { columns } from "./columns";
import { Filters } from "./Filters";

// Consulta pesada por padrão (sem filtro de período) sobrecarrega o backend
// à medida que a base cresce — filtro inicial nos últimos 5 dias, ajustável
// livremente pelo usuário.
const DEFAULT_RANGE_DAYS = 5;

export default function PurchaseRequestsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [departmentId, setDepartmentId] = useState<string>("all");
  const [organizationId, setOrganizationId] = useState<string>("all");
  const [startDate, setStartDate] = useState(() => daysAgoDateString(DEFAULT_RANGE_DAYS));
  const [endDate, setEndDate] = useState(() => todayDateString());
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const debouncedSearch = useDebounce(search);

  const { data: departments } = useQuery({ queryKey: ["departments", "active"], queryFn: () => departmentsService.listActive() });
  const { data: organizations } = useQuery({ queryKey: ["organizations", "my-accessible"], queryFn: () => organizationsService.myAccessible() });
  // Só departamentos que têm a organização escolhida como principal — sem
  // organização selecionada, mostra todos (mesma regra do filtro de Equipamentos).
  const departmentOptions = (departments ?? []).filter(
    (d) => organizationId === "all" || isHomeOrganization(d, organizationId)
  );

  // Quando há só uma organização acessível, o seletor de organização fica
  // oculto (nada a escolher) — sem isso, o filtro de departamento (que
  // depende de uma organização selecionada) ficaria travado pra sempre.
  useEffect(() => {
    if (organizations?.length === 1 && organizationId === "all") {
      setOrganizationId(organizations[0].id);
    }
  }, [organizations, organizationId]);

  const params = useMemo(
    () => ({
      page, limit: 10, search: debouncedSearch || undefined,
      status: status !== "all" ? status : undefined,
      departmentId: departmentId !== "all" ? departmentId : undefined,
      organizationId: organizationId !== "all" ? organizationId : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sortBy, sortOrder,
    }),
    [page, debouncedSearch, status, departmentId, organizationId, startDate, endDate, sortBy, sortOrder]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-requests", params],
    queryFn: () => purchaseRequestsService.list(params),
  });

  const handleExport = async () => {
    const blob = await purchaseRequestsService.exportCsv(params);
    downloadCsvBlob(blob, "solicitacoes-compra.csv");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: "Solicitações de Compra" }]} />
        <PermissionGate permissions={[PermissionKey.CREATE_PURCHASE_REQUEST]}>
          <Button onClick={() => navigate("/purchase-requests/new")}>
            <Plus className="h-4 w-4" /> Nova Solicitação
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        meta={data?.meta}
        page={page}
        onPageChange={setPage}
        search={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        isLoading={isLoading}
        onExportCsv={handleExport}
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/purchase-requests/${row.id}`)}
        emptyTitle="Nenhuma solicitação encontrada"
        emptyDescription="Crie uma nova solicitação de compra para começar."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextSortOrder) => { setSortBy(nextSortBy); setSortOrder(nextSortOrder); setPage(1); }}
        filters={
          <Filters
            startDate={startDate}
            onStartDateChange={(v) => { setStartDate(v); setPage(1); }}
            endDate={endDate}
            onEndDateChange={(v) => { setEndDate(v); setPage(1); }}
            status={status}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
            departmentId={departmentId}
            onDepartmentIdChange={(v) => { setDepartmentId(v); setPage(1); }}
            departments={departmentOptions}
            organizationId={organizationId}
            onOrganizationIdChange={(v) => { setOrganizationId(v); setDepartmentId("all"); setPage(1); }}
            organizations={organizations}
          />
        }
      />
    </div>
  );
}
