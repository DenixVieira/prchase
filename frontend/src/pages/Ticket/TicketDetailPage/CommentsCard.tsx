import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { UserNameTag } from "@/components/shared/UserNameTag";
import { MentionTextarea } from "@/components/shared/MentionTextarea";
import { MentionText, MentionCandidate } from "@/components/shared/MentionText";
import { ticketsService } from "@/services/tickets.service";
import { usersService } from "@/services/users.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { formatDate, initials } from "@/lib/utils";
import { PermissionKey, Ticket } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

export function CommentsCard({ ticket }: { ticket: Ticket }) {
  const { showToast } = useToast();
  const invalidate = useInvalidateTicket();
  const [comment, setComment] = useState("");

  // Candidatos pra realçar "@Nome" como chip nos comentários já enviados —
  // mesma lista (usuários ativos) que o MentionTextarea usa no autocomplete,
  // mais os autores dos comentários já carregados (cobre alguém que comentou
  // e depois virou inativo, ainda assim reconhecido no que já foi escrito).
  const { data: activeUsers } = useQuery({ queryKey: ["users", "mention-candidates"], queryFn: () => usersService.search({ limit: 50 }) });
  const candidates = useMemo(() => {
    const byName = new Map<string, MentionCandidate>();
    for (const u of activeUsers ?? []) byName.set(u.name, { id: u.id, name: u.name, avatarDataUrl: u.avatarDataUrl });
    for (const c of ticket.comments ?? []) {
      if (!byName.has(c.author.name)) byName.set(c.author.name, { id: c.author.id, name: c.author.name, avatarDataUrl: c.author.avatarDataUrl });
    }
    return Array.from(byName.values());
  }, [activeUsers, ticket.comments]);

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
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.author.avatarDataUrl ?? undefined} alt={c.author.name} />
                <AvatarFallback>{initials(c.author.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-lg bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium"><UserNameTag user={c.author} /></span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap"><MentionText text={c.content} candidates={candidates} /></p>
              </div>
            </div>
          ))}
          {(ticket.comments ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum comentário ainda. Inicie a conversa.</p>}
        </div>

        {!ticket.isArchived && (
          <PermissionGate permissions={[PermissionKey.COMMENT_TICKET]}>
            <div className="flex gap-2 pt-2">
              <MentionTextarea placeholder="Escreva um comentário... use @ para mencionar alguém" value={comment} onChange={setComment} rows={2} />
              <Button onClick={handleComment}><Send className="h-4 w-4" /></Button>
            </div>
          </PermissionGate>
        )}
      </CardContent>
    </Card>
  );
}
