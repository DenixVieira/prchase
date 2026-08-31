import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import { BoardColumn as BoardColumnType, Ticket } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { TicketCard } from "./TicketCard";

interface BoardViewProps {
  isLoading: boolean;
  columns: BoardColumnType[];
  ticketsByColumn: Record<string, Ticket[]>;
  /** Total real por coluna no banco — pode ser maior que ticketsByColumn[columnId].length quando o teto por coluna cortou a lista. */
  columnTotals?: Record<string, number>;
  onLoadMore: () => void;
  canDrag: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  activeTicket: Ticket | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function BoardView({ isLoading, columns, ticketsByColumn, columnTotals, onLoadMore, canDrag, sensors, activeTicket, onDragStart, onDragEnd }: BoardViewProps) {
  if (isLoading || columns.length === 0) {
    return <div className="flex gap-4">{(columns.length ? columns : [1, 2, 3, 4]).map((c, i) => <Skeleton key={typeof c === "object" ? c.id : i} className="h-96 w-72" />)}</div>;
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tickets={ticketsByColumn[column.id] ?? []}
            total={columnTotals?.[column.id]}
            onLoadMore={onLoadMore}
            draggable={canDrag}
          />
        ))}
      </div>
      <DragOverlay>{activeTicket && <TicketCard ticket={activeTicket} draggable={false} />}</DragOverlay>
    </DndContext>
  );
}
