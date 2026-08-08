import { Trash2, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { organizationsService } from "@/services/organizations.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Organization } from "@/types";

interface OrganizationCardProps {
  organization: Organization;
  onEdit: () => void;
}

export function OrganizationCard({ organization, onEdit }: OrganizationCardProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["organizations"] });

  const toggleActive = async (isActive: boolean) => {
    try {
      await organizationsService.update(organization.id, { isActive });
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao atualizar organização", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleRemove = async () => {
    try {
      await organizationsService.remove(organization.id);
      showToast({ title: "Organização removida", variant: "success" });
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao remover organização", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{organization.name}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{organization.description || "Sem descrição"}</p>
        </div>
        <Badge variant={organization.isActive ? "success" : "destructive"}>{organization.isActive ? "Ativo" : "Inativo"}</Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <Switch checked={organization.isActive} onCheckedChange={toggleActive} />
          Ativo
        </label>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
          <ConfirmDialog
            trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
            title="Remover organização"
            description={`Remover a organização "${organization.name}"? Departamentos e registros vinculados a ela ficarão sem organização.`}
            variant="destructive"
            onConfirm={handleRemove}
          />
        </div>
      </CardContent>
    </Card>
  );
}
