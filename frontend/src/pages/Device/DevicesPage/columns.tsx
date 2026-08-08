import { DataTableColumn } from "@/components/shared/DataTable";
import { WarrantyBadge } from "@/components/shared/WarrantyBadge";
import { formatDateOnly } from "@/lib/utils";
import { Device } from "@/types";

export const columns: DataTableColumn<Device>[] = [
  { key: "name", header: "Nome", sortKey: "name", render: (row) => <span className="font-medium">{row.name || "—"}</span> },
  { key: "serialNumber", header: "Nº de Série", sortKey: "serialNumber", render: (row) => <span className="font-mono text-xs">{row.serialNumber}</span> },
  { key: "model", header: "Modelo", sortKey: "model", render: (row) => row.model },
  { key: "brand", header: "Marca", sortKey: "brand", render: (row) => row.brand },
  { key: "organization", header: "Organização", render: (row) => row.organization?.name ?? "—" },
  { key: "department", header: "Departamento", render: (row) => row.department?.name ?? "—" },
  { key: "assignedToName", header: "Funcionário", render: (row) => row.assignedToName || "Uso coletivo" },
  { key: "warranty", header: "Garantia", sortKey: "warrantyExpiration", render: (row) => (
    <div className="flex flex-col items-center gap-1">
      <WarrantyBadge warrantyExpiration={row.warrantyExpiration} />
      <span className="text-xs text-muted-foreground">{formatDateOnly(row.warrantyExpiration)}</span>
    </div>
  ) },
];
