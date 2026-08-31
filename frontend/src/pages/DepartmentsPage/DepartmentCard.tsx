import { ShieldCheck, Trash2, Globe2, Kanban } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { departmentsService } from "@/services/departments.service";
import { departmentGroupsService } from "@/services/departmentGroups.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Department } from "@/types";

const NO_GROUP = "none";

interface DepartmentCardProps {
  department: Department;
  onManagePermissions: () => void;
  onManageOrganizations: () => void;
  onManageBoard: () => void;
}

export function DepartmentCard({ department, onManagePermissions, onManageOrganizations, onManageBoard }: DepartmentCardProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: groups } = useQuery({ queryKey: ["department-groups"], queryFn: () => departmentGroupsService.list() });

  const handleRemove = async () => {
    try {
      await departmentsService.remove(department.id);
      showToast({ title: "Departamento removido", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch (error) {
      showToast({ title: "Erro ao remover departamento", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleGroupChange = async (value: string) => {
    try {
      await departmentsService.update(department.id, { departmentGroupId: value !== NO_GROUP ? value : null });
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    } catch (error) {
      showToast({ title: "Erro ao alterar grupo", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{department.name}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">{department.description || "Sem descrição"}</p>
        </div>
        <Badge variant={department.isActive ? "success" : "destructive"}>{department.isActive ? "Ativo" : "Inativo"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Grupo</span>
          <Select value={department.departmentGroupId ?? NO_GROUP} onValueChange={handleGroupChange}>
            <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Sem grupo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_GROUP}>Sem grupo</SelectItem>
              {(groups ?? []).map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between flex-col">
          <div className="flex flex-wrap gap-0.5">
            <span className="text-xs text-muted-foreground">{(department.permissions ?? []).length} permissões concedidas</span>
            <span className="text-xs text-muted-foreground">
              {department.hasFullOrganizationAccess
                ? "Acesso a todas as organizações"
                : department.homeOrganization
                  ? `Organização: ${department.homeOrganization.name}`
                  : "Sem organização configurada"}
            </span>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={onManagePermissions}>
              <ShieldCheck className="h-4 w-4" /> Permissões
            </Button>
            <Button variant="outline" size="sm" onClick={onManageOrganizations}>
              <Globe2 className="h-4 w-4" /> Organizações
            </Button>
            <Button variant="outline" size="sm" onClick={onManageBoard}>
              <Kanban className="h-4 w-4" /> Board
            </Button>
            <ConfirmDialog
              trigger={<Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
              title="Remover departamento"
              description={`Remover o departamento "${department.name}"? Usuários vinculados perderão o departamento.`}
              variant="destructive"
              onConfirm={handleRemove}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
