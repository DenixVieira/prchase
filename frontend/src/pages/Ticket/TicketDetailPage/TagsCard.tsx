import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tags, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { ticketsService } from "@/services/tickets.service";
import { tagsService } from "@/services/tags.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { usePermission } from "@/hooks/usePermission";
import { PermissionKey, Ticket } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

const TAG_COLOR_PALETTE = ["#6366f1", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#8b5cf6", "#ec4899", "#64748b"];

export function TagsCard({ ticket }: { ticket: Ticket }) {
  const { showToast } = useToast();
  const { can } = usePermission();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTicket();
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLOR_PALETTE[0]);

  const { data: allTags } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagsService.list(),
    enabled: tagDialogOpen,
  });

  const handleAddTag = async (tagId: string) => {
    try {
      await ticketsService.addTag(ticket.id, tagId);
      invalidate();
      showToast({ title: "Etiqueta adicionada", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao adicionar etiqueta", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await ticketsService.removeTag(ticket.id, tagId);
      invalidate();
      showToast({ title: "Etiqueta removida", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao remover etiqueta", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await tagsService.create({ name: newTagName.trim(), color: newTagColor });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      // Cria e já aplica no ticket atual — evita um segundo passo de "criar
      // depois clicar pra adicionar" no mesmo fluxo.
      await ticketsService.addTag(ticket.id, tag.id);
      invalidate();
      setNewTagName("");
      showToast({ title: "Etiqueta criada e adicionada", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao criar etiqueta", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Etiquetas</CardTitle>
        {!ticket.isArchived && (
          <PermissionGate permissions={[PermissionKey.MOVE_TICKET]}>
            <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost"><Tags className="h-4 w-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Etiquetas</DialogTitle></DialogHeader>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {(allTags ?? [])
                    .filter((t) => !(ticket.tags ?? []).some((applied) => applied.id === t.id))
                    .map((t) => (
                      <button
                        key={t.id}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-sm hover:bg-accent"
                        onClick={() => handleAddTag(t.id)}
                      >
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </button>
                    ))}
                  {(allTags ?? []).filter((t) => !(ticket.tags ?? []).some((applied) => applied.id === t.id)).length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhuma etiqueta disponível.</p>
                  )}
                </div>
                <PermissionGate permissions={[PermissionKey.CREATE_TAG]}>
                  <div className="space-y-2 border-t border-border pt-3">
                    <Label className="text-xs">Nova etiqueta</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Nome" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
                      <Button size="sm" onClick={handleCreateTag} disabled={!newTagName.trim()}>Criar</Button>
                    </div>
                    <div className="flex gap-1.5">
                      {TAG_COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          aria-label={`Cor ${color}`}
                          onClick={() => setNewTagColor(color)}
                          className={`h-6 w-6 rounded-full border-2 ${newTagColor === color ? "border-foreground" : "border-transparent"}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </PermissionGate>
              </DialogContent>
            </Dialog>
          </PermissionGate>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {(ticket.tags ?? []).map((t) => (
            <Badge key={t.id} className="gap-1 border-transparent" style={{ backgroundColor: t.color, color: "#fff" }}>
              {t.name}
              {!ticket.isArchived && can(PermissionKey.MOVE_TICKET) && (
                <button onClick={() => handleRemoveTag(t.id)} className="ml-0.5 opacity-80 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {(ticket.tags ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhuma etiqueta.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
