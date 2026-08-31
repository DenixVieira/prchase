import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { departmentsService } from "@/services/departments.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Department, PermissionKey } from "@/types";
import { PERMISSION_GROUPS } from "./permissionGroups";

interface PermissionsDialogProps {
  department: Department | null;
  catalog?: { id: string; key: PermissionKey; description: string }[];
  onOpenChange: (open: boolean) => void;
  onDepartmentChange: (department: Department) => void;
}

export function PermissionsDialog({ department, catalog, onOpenChange, onDepartmentChange }: PermissionsDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Cópia local otimista das chaves concedidas. Antes, cada clique recalculava
  // o conjunto a partir da prop `department`, que só é atualizada depois que o
  // PUT anterior responde — clicar duas vezes rápido (duplo clique) disparava
  // dois toggles a partir do MESMO snapshot desatualizado, e a resposta que
  // chegasse por último sobrescrevia a outra, deixando permissões erradas
  // marcadas. Sincroniza de novo só quando troca de departamento (abre o
  // diálogo para outro card), não a cada resposta do próprio toggle.
  const [grantedKeys, setGrantedKeys] = useState<Set<PermissionKey>>(new Set());
  useEffect(() => {
    setGrantedKeys(new Set((department?.permissions ?? []).map((p) => p.permission.key)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department?.id]);

  // Enquanto uma chamada está em andamento, os checkboxes ficam desabilitados
  // — impede que um segundo clique (duplo clique) dispare outro PUT
  // concorrente pro mesmo departamento antes do primeiro terminar.
  const [saving, setSaving] = useState(false);

  const togglePermission = async (key: PermissionKey, checked: boolean) => {
    if (!department || saving) return;
    const previous = grantedKeys;
    const next = new Set(previous);
    if (checked) next.add(key);
    else next.delete(key);
    setGrantedKeys(next);
    setSaving(true);
    try {
      const updated = await departmentsService.updatePermissions(department.id, Array.from(next));
      onDepartmentChange(updated);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch (error) {
      setGrantedKeys(previous);
      showToast({ title: "Erro ao atualizar permissões", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const groupedKeys = new Set(PERMISSION_GROUPS.flatMap((g) => g.keys));
  const ungrouped = (catalog ?? []).filter((p) => !groupedKeys.has(p.key));
  const groups = ungrouped.length > 0
    ? [...PERMISSION_GROUPS, { title: "Outras Permissões", keys: ungrouped.map((p) => p.key) }]
    : PERMISSION_GROUPS;

  return (
    <Dialog open={!!department} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Permissões — {department?.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
          {groups.map((group) => {
            const items = (catalog ?? []).filter((p) => group.keys.includes(p.key));
            if (items.length === 0) return null;
            return (
              <div key={group.title} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.title}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((permission) => {
                    const checked = grantedKeys.has(permission.key);
                    return (
                      <label key={permission.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={checked}
                          disabled={saving}
                          onCheckedChange={(value) => togglePermission(permission.key, !!value)}
                        />
                        {permission.description}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
