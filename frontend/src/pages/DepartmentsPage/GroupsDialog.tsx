import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { departmentGroupsService } from "@/services/departmentGroups.service";
import { organizationsService } from "@/services/organizations.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { DepartmentGroup } from "@/types";

const NO_ORGANIZATION = "none";

interface GroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GroupsDialog({ open, onOpenChange }: GroupsDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [newName, setNewName] = useState("");
  const [newOrganizationId, setNewOrganizationId] = useState(NO_ORGANIZATION);

  const { data: groups } = useQuery({ queryKey: ["department-groups"], queryFn: () => departmentGroupsService.list(), enabled: open });
  const { data: organizations } = useQuery({ queryKey: ["organizations", "active"], queryFn: () => organizationsService.listActive(), enabled: open });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["department-groups"] });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await departmentGroupsService.create({
        name: newName.trim(),
        organizationId: newOrganizationId !== NO_ORGANIZATION ? newOrganizationId : undefined,
      });
      setNewName("");
      setNewOrganizationId(NO_ORGANIZATION);
      invalidate();
      showToast({ title: "Grupo criado", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao criar grupo", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const startEditing = (group: DepartmentGroup) => {
    setEditingId(group.id);
    setEditingName(group.name);
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await departmentGroupsService.update(id, { name: editingName.trim() });
      setEditingId(null);
      invalidate();
      showToast({ title: "Grupo renomeado", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao renomear grupo", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await departmentGroupsService.remove(id);
      invalidate();
      // Departamentos ligados ao grupo removido ficam automaticamente sem
      // grupo (FK com ON DELETE SET NULL) — precisa refletir isso na lista.
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      showToast({ title: "Grupo removido", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao remover grupo", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Grupos de Departamentos</DialogTitle></DialogHeader>
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {(groups ?? []).map((group) => (
            <div key={group.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
              {editingId === group.id ? (
                <>
                  <Input
                    autoFocus
                    className="h-8"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename(group.id)}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleRename(group.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{group.name}</p>
                    {group.organization && <p className="text-xs text-muted-foreground truncate">{group.organization.name}</p>}
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => startEditing(group)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <ConfirmDialog
                    trigger={<Button size="icon" variant="ghost" className="h-8 w-8 shrink-0"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                    title="Remover grupo"
                    description={`Remover o grupo "${group.name}"? Os departamentos vinculados ficarão sem grupo.`}
                    variant="destructive"
                    onConfirm={() => handleRemove(group.id)}
                  />
                </>
              )}
            </div>
          ))}
          {(groups ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum grupo criado.</p>}
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <Label className="text-xs">Novo grupo</Label>
          <div className="flex gap-2">
            <Input placeholder="Nome do grupo" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Button onClick={handleCreate} disabled={!newName.trim()}>Criar</Button>
          </div>
          <Select value={newOrganizationId} onValueChange={setNewOrganizationId}>
            <SelectTrigger><SelectValue placeholder="Organização (opcional)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_ORGANIZATION}>Sem organização vinculada</SelectItem>
              {(organizations ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  );
}
