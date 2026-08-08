import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { DataTable } from "@/components/shared/DataTable";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { Button } from "@/components/ui/button";
import { devicesService } from "@/services/devices.service";
import { departmentsService } from "@/services/departments.service";
import { organizationsService } from "@/services/organizations.service";
import { useDebounce } from "@/hooks/useDebounce";
import { isHomeOrganization } from "@/lib/departmentOrganization";
import { PermissionKey } from "@/types";
import { columns } from "./columns";
import { Filters } from "./Filters";

export default function DevicesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const debouncedSearch = useDebounce(search);

  const { data: organizations } = useQuery({ queryKey: ["organizations", "my-accessible"], queryFn: () => organizationsService.myAccessible() });
  const { data: departments } = useQuery({ queryKey: ["departments", "active"], queryFn: () => departmentsService.listActive() });
  // Só departamentos que têm a organização escolhida como principal — sem
  // organização selecionada, mostra todos.
  const departmentOptions = (departments ?? []).filter(
    (d) => organizationId === "all" || isHomeOrganization(d, organizationId)
  );

  const params = useMemo(
    () => ({
      page, limit: 10, search: debouncedSearch || undefined,
      organizationId: organizationId !== "all" ? organizationId : undefined,
      departmentId: departmentId !== "all" ? departmentId : undefined,
      sortBy, sortOrder,
    }),
    [page, debouncedSearch, organizationId, departmentId, sortBy, sortOrder]
  );

  const { data, isLoading } = useQuery({ queryKey: ["devices", params], queryFn: () => devicesService.list(params) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: "Equipamentos" }]} />
        <PermissionGate permissions={[PermissionKey.CREATE_DEVICE]}>
          <Button onClick={() => navigate("/devices/new")}>
            <Plus className="h-4 w-4" /> Novo Equipamento
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
        rowKey={(row) => row.id}
        onRowClick={(row) => navigate(`/devices/${row.id}`)}
        emptyTitle="Nenhum equipamento encontrado"
        emptyDescription="Cadastre um novo equipamento para começar."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextSortOrder) => { setSortBy(nextSortBy); setSortOrder(nextSortOrder); setPage(1); }}
        filters={
          <Filters
            organizationId={organizationId}
            onOrganizationIdChange={(v) => { setOrganizationId(v); setDepartmentId("all"); setPage(1); }}
            organizations={organizations}
            departmentId={departmentId}
            onDepartmentIdChange={(v) => { setDepartmentId(v); setPage(1); }}
            departments={departmentOptions}
          />
        }
      />
    </div>
  );
}
