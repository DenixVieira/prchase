import { DataTableColumn } from "@/components/shared/DataTable";
import { AuditLog } from "@/types";
import { formatDate } from "@/lib/utils";

export const columns: DataTableColumn<AuditLog>[] = [
  { key: "date", header: "Data", sortKey: "createdAt", render: (log) => formatDate(log.createdAt) },
  { key: "user", header: "Usuário", render: (log) => log.user?.name ?? "Sistema" },
  { key: "action", header: "Ação", sortKey: "action", render: (log) => log.action },
  { key: "entity", header: "Entidade", sortKey: "entity", render: (log) => log.entity },
  { key: "ip", header: "IP", render: (log) => log.ipAddress ?? "—" },
];
