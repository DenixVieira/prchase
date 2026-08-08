import { FileArchive, Download, ExternalLink, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateOnly } from "@/lib/utils";
import { Attachment } from "@/types";
import { isOverdue } from "./constants";

export type ConsultSortKey = "dueDate" | "createdAt";

interface ConsultTabProps {
  filtersReady: boolean;
  isLoadingInvoices: boolean;
  invoices?: Attachment[];
  onDownloadNote: (attachment: Attachment) => void;
  sortKey: ConsultSortKey;
  sortOrder: "ASC" | "DESC";
  onSortChange: (sortKey: ConsultSortKey, sortOrder: "ASC" | "DESC") => void;
}

function SortableHead({ label, sortKeyValue, sortKey, sortOrder, onSortChange }: {
  label: string;
  sortKeyValue: ConsultSortKey;
  sortKey: ConsultSortKey;
  sortOrder: "ASC" | "DESC";
  onSortChange: (sortKey: ConsultSortKey, sortOrder: "ASC" | "DESC") => void;
}) {
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSortChange(sortKeyValue, sortKey === sortKeyValue && sortOrder === "ASC" ? "DESC" : "ASC")}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {sortKey === sortKeyValue ? (
          sortOrder === "ASC" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function ConsultTab({ filtersReady, isLoadingInvoices, invoices, onDownloadNote, sortKey, sortOrder, onSortChange }: ConsultTabProps) {
  const sortedInvoices = [...(invoices ?? [])].sort((a, b) => {
    const aValue = (sortKey === "dueDate" ? a.dueDate : a.createdAt) ?? "";
    const bValue = (sortKey === "dueDate" ? b.dueDate : b.createdAt) ?? "";
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === "ASC" ? comparison : -comparison;
  });

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket</TableHead>
            <TableHead>Arquivo</TableHead>
            <SortableHead label="Vencimento" sortKeyValue="dueDate" sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
            <SortableHead label="Anexado em" sortKeyValue="createdAt" sortKey={sortKey} sortOrder={sortOrder} onSortChange={onSortChange} />
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!filtersReady && (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState icon={FileArchive} title="Selecione organização e período" description="Escolha os filtros acima para consultar as notas fiscais." />
              </TableCell>
            </TableRow>
          )}
          {filtersReady && !isLoadingInvoices && (invoices ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>
                <EmptyState icon={FileArchive} title="Nenhuma nota fiscal encontrada" description="Não há notas fiscais anexadas no período escolhido." />
              </TableCell>
            </TableRow>
          )}
          {filtersReady && sortedInvoices.map((attachment) => (
            <TableRow key={attachment.id}>
              <TableCell>
                {attachment.ticket ? (
                  <a href={`/tickets/${attachment.ticket.id}`} className="flex items-center gap-1 text-primary hover:underline">
                    {attachment.ticket.protocol} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : "—"}
              </TableCell>
              <TableCell className="max-w-xs truncate">{attachment.originalName}</TableCell>
              <TableCell className={isOverdue(attachment) ? "font-medium text-destructive" : ""}>
                {attachment.dueDate ? formatDateOnly(attachment.dueDate) : "—"}
              </TableCell>
              <TableCell>{formatDateOnly(attachment.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => onDownloadNote(attachment)}>
                  <Download className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
