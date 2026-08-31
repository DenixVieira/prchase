import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, UserMinus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserNameTag } from "@/components/shared/UserNameTag";
import { ticketsService } from "@/services/tickets.service";
import { usersService } from "@/services/users.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/contexts/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { initials } from "@/lib/utils";
import { PermissionKey, Ticket } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

export function FollowersCard({ ticket }: { ticket: Ticket }) {
  const { user } = useAuth();
  const { can } = usePermission();
  const { showToast } = useToast();
  const invalidate = useInvalidateTicket();
  const [followerSearch, setFollowerSearch] = useState("");
  const [followerDialogOpen, setFollowerDialogOpen] = useState(false);
  const debouncedFollowerSearch = useDebounce(followerSearch);

  const { data: userOptions } = useQuery({
    queryKey: ["users", "search", debouncedFollowerSearch],
    queryFn: () => usersService.search({ search: debouncedFollowerSearch, limit: 10 }),
    enabled: followerDialogOpen,
  });

  const handleAddFollower = async (userId: string) => {
    try {
      await ticketsService.addFollower(ticket.id, userId);
      invalidate();
      showToast({ title: "Acompanhante adicionado", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao adicionar acompanhante", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleRemoveFollower = async (userId: string) => {
    try {
      await ticketsService.removeFollower(ticket.id, userId);
      invalidate();
      showToast({ title: userId === user?.id ? "Você deixou de acompanhar o ticket" : "Acompanhante removido", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao remover acompanhante", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleToggleFollow = async (isFollowing: boolean) => {
    if (isFollowing) await handleRemoveFollower(user!.id);
    else await handleAddFollower(user!.id);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Acompanhantes</CardTitle>
        {!ticket.isArchived && (
          <Dialog open={followerDialogOpen} onOpenChange={setFollowerDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost"><UserPlus className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar acompanhante</DialogTitle></DialogHeader>
              <Input placeholder="Buscar usuário..." value={followerSearch} onChange={(e) => setFollowerSearch(e.target.value)} />
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {(userOptions ?? []).map((u) => (
                  <button
                    key={u.id}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
                    onClick={() => { handleAddFollower(u.id); setFollowerDialogOpen(false); }}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={u.avatarDataUrl ?? undefined} alt={u.name} />
                      <AvatarFallback className="text-[10px]">{initials(u.name)}</AvatarFallback>
                    </Avatar>
                    {u.name}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!ticket.isArchived && (() => {
          const isFollowing = (ticket.followers ?? []).some((f) => f.user.id === user?.id);
          return (
            <Button
              size="sm"
              variant={isFollowing ? "outline" : "default"}
              className="w-full"
              onClick={() => handleToggleFollow(isFollowing)}
            >
              {isFollowing ? <><UserMinus className="h-4 w-4" /> Deixar de seguir</> : <><UserPlus className="h-4 w-4" /> Seguir este ticket</>}
            </Button>
          );
        })()}
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
          {(ticket.followers ?? []).map((follower) => {
            const canRemove = !ticket.isArchived && (follower.user.id === user?.id || can(PermissionKey.MOVE_TICKET));
            return (
              <div key={follower.id} className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={follower.user.avatarDataUrl ?? undefined} alt={follower.user.name} />
                  <AvatarFallback className="text-[9px]">{initials(follower.user.name)}</AvatarFallback>
                </Avatar>
                <UserNameTag user={follower.user} tagClassName="bg-background/70" />
                {canRemove && (
                  <button onClick={() => handleRemoveFollower(follower.user.id)} className="ml-0.5 rounded-full hover:bg-background/60">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
          {(ticket.followers ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum acompanhante.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
