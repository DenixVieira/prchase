import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { departmentsService } from "@/services/departments.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Department, Organization } from "@/types";

interface OrganizationsDialogProps {
  department: Department | null;
  organizations?: Organization[];
  onOpenChange: (open: boolean) => void;
}

export function OrganizationsDialog({ department, organizations, onOpenChange }: OrganizationsDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [orgForm, setOrgForm] = useState<{ homeOrganizationId: string; hasFullOrganizationAccess: boolean; allowedOrganizationIds: string[] }>({
    homeOrganizationId: "",
    hasFullOrganizationAccess: false,
    allowedOrganizationIds: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!department) return;
    setOrgForm({
      homeOrganizationId: department.homeOrganizationId ?? "",
      hasFullOrganizationAccess: !!department.hasFullOrganizationAccess,
      allowedOrganizationIds: (department.allowedOrganizations ?? []).map((e) => e.id),
    });
  }, [department]);

  const toggleAllowedOrganization = (organizationId: string, checked: boolean) => {
    setOrgForm((prev) => ({
      ...prev,
      allowedOrganizationIds: checked
        ? Array.from(new Set([...prev.allowedOrganizationIds, organizationId]))
        : prev.allowedOrganizationIds.filter((id) => id !== organizationId),
    }));
  };

  const handleSave = async () => {
    if (!department) return;
    setSaving(true);
    try {
      await departmentsService.update(department.id, {
        homeOrganizationId: orgForm.homeOrganizationId || undefined,
        hasFullOrganizationAccess: orgForm.hasFullOrganizationAccess,
        allowedOrganizationIds: orgForm.allowedOrganizationIds,
      });
      showToast({ title: "Acesso a organizações atualizado", variant: "success" });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch (error) {
      showToast({ title: "Erro ao atualizar acesso a organizações", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!department} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Organizações — {department?.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Organização principal (sugerida ao criar novas solicitações)</Label>
            <Select
              value={orgForm.homeOrganizationId || undefined}
              onValueChange={(value) => setOrgForm((prev) => ({ ...prev, homeOrganizationId: value }))}
            >
              <SelectTrigger><SelectValue placeholder="Selecione uma organização" /></SelectTrigger>
              <SelectContent>
                {(organizations ?? []).map((organization) => (
                  <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-3 rounded-md border border-border p-3 text-sm cursor-pointer">
            <Switch
              checked={orgForm.hasFullOrganizationAccess}
              onCheckedChange={(checked) => setOrgForm((prev) => ({ ...prev, hasFullOrganizationAccess: checked }))}
            />
            <span>
              Acesso total: este departamento visualiza e interage com solicitações e tickets de{" "}
              <strong>todas</strong> as organizações, ignorando a lista abaixo.
            </span>
          </label>

          {!orgForm.hasFullOrganizationAccess && (
            <div className="space-y-1.5">
              <Label>Organizações adicionais permitidas</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {(organizations ?? []).map((organization) => (
                  <label key={organization.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={orgForm.allowedOrganizationIds.includes(organization.id)}
                      onCheckedChange={(value) => toggleAllowedOrganization(organization.id, !!value)}
                    />
                    {organization.name}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                A organização principal selecionada acima já fica automaticamente acessível — marque aqui somente
                organizações extras que este departamento também deve poder acessar.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} isLoading={saving}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
