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

  const togglePermission = async (key: PermissionKey, checked: boolean) => {
    if (!department) return;
    const current = new Set((department.permissions ?? []).map((p) => p.permission.key));
    if (checked) current.add(key);
    else current.delete(key);
    try {
      const updated = await departmentsService.updatePermissions(department.id, Array.from(current));
      onDepartmentChange(updated);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch (error) {
      showToast({ title: "Erro ao atualizar permissões", description: extractErrorMessage(error), variant: "destructive" });
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
                    const checked = (department?.permissions ?? []).some((p) => p.permission.key === permission.key);
                    return (
                      <label key={permission.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={checked}
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
