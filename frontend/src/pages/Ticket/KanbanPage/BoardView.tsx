import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, TicketStatus } from "@/types";
import { COLUMNS } from "./constants";
import { KanbanColumn } from "./KanbanColumn";
import { TicketCard } from "./TicketCard";

interface BoardViewProps {
  isLoading: boolean;
  ticketsByStatus: Record<TicketStatus, Ticket[]>;
  /** Total real por status no banco — pode ser maior que ticketsByStatus[status].length quando o teto por coluna cortou a lista. */
  columnTotals?: Record<string, number>;
  onLoadMore: () => void;
  canDrag: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  activeTicket: Ticket | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function BoardView({ isLoading, ticketsByStatus, columnTotals, onLoadMore, canDrag, sensors, activeTicket, onDragStart, onDragEnd }: BoardViewProps) {
  if (isLoading) {
    return <div className="flex gap-4">{COLUMNS.map((c) => <Skeleton key={c.status} className="h-96 w-72" />)}</div>;
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            accent={column.accent}
            tickets={ticketsByStatus[column.status]}
            total={columnTotals?.[column.status]}
            onLoadMore={onLoadMore}
            draggable={canDrag}
          />
        ))}
      </div>
      <DragOverlay>{activeTicket && <TicketCard ticket={activeTicket} draggable={false} />}</DragOverlay>
    </DndContext>
  );
}
