import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { ticketsService } from "@/services/tickets.service";
import { useRedirectOnQueryError } from "@/hooks/useRedirectOnQueryError";
import { HeaderCard } from "./HeaderCard";
import { CommentsCard } from "./CommentsCard";
import { HistoryCard } from "./HistoryCard";
import { DetailsCard } from "./DetailsCard";
import { TagsCard } from "./TagsCard";
import { AssigneeCard } from "./AssigneeCard";
import { FollowersCard } from "./FollowersCard";
import { InvoiceNoteCard } from "./InvoiceNoteCard";
import { RequestFieldsCard } from "./RequestFieldsCard";
import { AttachmentsCard } from "./AttachmentsCard";
import { PreviewDialog } from "./PreviewDialog";
import { useAttachmentPreview } from "./useAttachmentPreview";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isLoading, isError, error } = useQuery({
    queryKey: ["tickets", id],
    queryFn: () => ticketsService.findOne(id!),
    enabled: !!id,
  });
  // Ticket inexistente ou de organização sem acesso: volta para o Kanban em
  // vez de deixar a tela presa no skeleton indefinidamente.
  useRedirectOnQueryError(isError, error, "/tickets");

  const { preview, handlePreview, closePreview } = useAttachmentPreview(id!);

  if (isLoading || !ticket) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3 max-w-6xl">
      <div className="lg:col-span-2 space-y-4">
        <Breadcrumb items={[{ label: "Kanban", to: "/tickets" }, { label: ticket.protocol }]} />
        <HeaderCard ticket={ticket} />
        <CommentsCard ticket={ticket} />
        <HistoryCard ticket={ticket} />
      </div>

      <div className="space-y-4">
        <DetailsCard ticket={ticket} />
        <TagsCard ticket={ticket} />
        <AssigneeCard ticket={ticket} />
        <FollowersCard ticket={ticket} />
        <RequestFieldsCard ticket={ticket} onPreview={handlePreview} />
        {/* Nota fiscal é exclusiva de tickets nascidos de Solicitação de Compra. */}
        {ticket.purchaseRequestId && <InvoiceNoteCard ticket={ticket} onPreview={handlePreview} />}
        <AttachmentsCard ticket={ticket} onPreview={handlePreview} />
      </div>

      <PreviewDialog ticketId={id!} preview={preview} onClose={closePreview} />
    </div>
  );
}
