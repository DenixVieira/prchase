import { DataTableColumn } from "@/components/shared/DataTable";
import { PurchaseRequestStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { UserNameTag } from "@/components/shared/UserNameTag";
import { formatCurrency, formatDateOnly } from "@/lib/utils";
import { PurchaseRequest } from "@/types";

export const columns: DataTableColumn<PurchaseRequest>[] = [
  { key: "number", header: "Número", sortKey: "number", render: (row) => <span className="font-medium">{row.number}</span> },
  { key: "supplier", header: "Fornecedor", sortKey: "supplier", render: (row) => row.supplier },
  { key: "department", header: "Departamento", render: (row) => row.department?.name },
  { key: "organization", header: "Organização", render: (row) => row.organization?.name ?? "—" },
  { key: "requester", header: "Solicitante", render: (row) => <UserNameTag user={row.requester} /> },
  { key: "value", header: "Valor Estimado", sortKey: "estimatedValue", render: (row) => formatCurrency(row.estimatedValue) },
  { key: "priority", header: "Prioridade", sortKey: "priority", render: (row) => <PriorityBadge priority={row.priority} /> },
  { key: "status", header: "Status", sortKey: "status", render: (row) => <PurchaseRequestStatusBadge status={row.status} /> },
  { key: "date", header: "Data", sortKey: "createdAt", render: (row) => formatDateOnly(row.createdAt) },
];
