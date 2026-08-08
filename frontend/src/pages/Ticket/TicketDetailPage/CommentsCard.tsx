import { useState } from "react";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { UserNameTag } from "@/components/shared/UserNameTag";
import { ticketsService } from "@/services/tickets.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { formatDate, initials } from "@/lib/utils";
import { PermissionKey, Ticket } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

export function CommentsCard({ ticket }: { ticket: Ticket }) {
  const { showToast } = useToast();
  const invalidate = useInvalidateTicket();
  const [comment, setComment] = useState("");

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      await ticketsService.addComment(ticket.id, comment);
      setComment("");
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao comentar", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Comentários</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-[32rem] overflow-y-auto pr-1">
          {(ticket.comments ?? []).map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0"><AvatarFallback>{initials(c.author.name)}</AvatarFallback></Avatar>
              <div className="flex-1 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium"><UserNameTag user={c.author} /></span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
              </div>
            </div>
          ))}
          {(ticket.comments ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Inicie a conversa.</p>}
        </div>

        {!ticket.isArchived && (
          <PermissionGate permissions={[PermissionKey.COMMENT_TICKET]}>
            <div className="flex gap-2 pt-2">
              <Textarea placeholder="Escreva um comentário..." value={comment} onChange={(e) => setComment(e.target.value)} rows={2} />
              <Button onClick={handleComment}><Send className="h-4 w-4" /></Button>
            </div>
          </PermissionGate>
        )}
      </CardContent>
    </Card>
  );
}
