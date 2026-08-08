import { ReactNode } from "react";
import { Search, Download, ChevronLeft, ChevronRight, Loader2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { PaginationMeta } from "@/types";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Nome da coluna no backend usado para ordenar — quando ausente, o
   * cabeçalho não vira clicável. Deve bater com o allowlist de `sortBy`
   * aceito pelo endpoint correspondente. */
  sortKey?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  meta?: PaginationMeta;
  page: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading?: boolean;
  onExportCsv?: () => void;
  filters?: ReactNode;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  onSortChange?: (sortBy: string, sortOrder: "ASC" | "DESC") => void;
}

export function DataTable<T>({
  columns, data, meta, page, onPageChange, search, onSearchChange, isLoading, onExportCsv,
  filters, rowKey, onRowClick, emptyTitle = "Nenhum registro encontrado", emptyDescription,
  sortBy, sortOrder, onSortChange,
}: DataTableProps<T>) {
  const handleSortClick = (column: DataTableColumn<T>) => {
    if (!column.sortKey || !onSortChange) return;
    if (sortBy === column.sortKey) {
      onSortChange(column.sortKey, sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      onSortChange(column.sortKey, "ASC");
    }
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Pesquisar..." className="pl-8" value={search} onChange={(e) => onSearchChange(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {filters}
          {onExportCsv && (
            <Button variant="outline" size="sm" onClick={onExportCsv}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) =>
                column.sortKey ? (
                  <TableHead key={column.key} className={column.className}>
                    <button
                      type="button"
                      onClick={() => handleSortClick(column)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {column.header}
                      {sortBy === column.sortKey ? (
                        sortOrder === "ASC" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                      )}
                    </button>
                  </TableHead>
                ) : (
                  <TableHead key={column.key} className={column.className}>{column.header}</TableHead>
                )
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.key}><Skeleton className="h-4 w-full max-w-[160px]" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <EmptyState icon={Search} title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              data.map((row) => (
                <TableRow key={rowKey(row)} onClick={() => onRowClick?.(row)} className={onRowClick ? "cursor-pointer" : ""}>
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>{column.render(row)}</TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {meta.page} de {meta.totalPages} — {meta.total} registro(s)
          </span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" disabled={page >= meta.totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      {isLoading && data.length === 0 && (
        <div className="flex justify-center py-2 text-muted-foreground text-xs items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
        </div>
      )}
    </div>
  );
}
