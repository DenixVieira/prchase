import { useDroppable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { BoardColumn as BoardColumnType, Ticket } from "@/types";
import { TicketCard } from "./TicketCard";

interface KanbanColumnProps {
  column: BoardColumnType;
  tickets: Ticket[];
  /** Total real desta coluna no banco — quando maior que tickets.length, a coluna foi cortada pelo teto por página. */
  total?: number;
  onLoadMore: () => void;
  draggable: boolean;
}

export function KanbanColumn({ column, tickets, total, onLoadMore, draggable }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const hasMore = typeof total === "number" && total > tickets.length;

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border-t-4 bg-muted/40 ${isOver ? "ring-2 ring-primary/50" : ""}`}
      style={{ borderTopColor: column.color }}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-semibold">{column.name}</span>
        <span className="text-xs text-muted-foreground bg-background rounded-full px-2 py-0.5">
          {hasMore ? `${tickets.length}/${total}` : tickets.length}
        </span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-3" style={{ minHeight: 120 }}>
        {tickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} draggable={draggable} />)}
        {hasMore && (
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={onLoadMore}>
            Carregar mais ({total! - tickets.length} restante{total! - tickets.length === 1 ? "" : "s"})
          </Button>
        )}
      </div>
    </div>
  );
}
