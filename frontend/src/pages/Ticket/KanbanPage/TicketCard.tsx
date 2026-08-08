import { useNavigate } from "react-router-dom";
import { useDraggable } from "@dnd-kit/core";
import { Paperclip, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { initials } from "@/lib/utils";
import { Ticket } from "@/types";

export function TicketCard({ ticket, draggable }: { ticket: Ticket; draggable: boolean }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id, disabled: !draggable });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(draggable ? { ...listeners, ...attributes } : {})}
      onClick={() => !isDragging && navigate(`/tickets/${ticket.id}`)}
      className={`cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow space-y-2 ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">{ticket.protocol}</span>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <p className="text-sm font-medium line-clamp-2">{ticket.title}</p>
      {ticket.requestType && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">{ticket.requestType.name}</Badge>
      )}
      <p className="text-xs text-muted-foreground">
        {ticket.department?.name}
        {ticket.organization?.name ? ` · ${ticket.organization.name}` : ""}
      </p>
      {(ticket.tags ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {(ticket.tags ?? []).map((t) => (
            <Badge key={t.id} className="border-transparent text-[10px] px-1.5 py-0" style={{ backgroundColor: t.color, color: "#fff" }}>
              {t.name}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {ticket.commentsCount ?? 0}</span>
          <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" /> {ticket.attachmentsCount ?? 0}</span>
        </div>
        {ticket.assignee ? (
          <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{initials(ticket.assignee.name)}</AvatarFallback></Avatar>
        ) : (
          <span className="text-[10px] text-muted-foreground">Não atribuído</span>
        )}
      </div>
    </div>
  );
}
