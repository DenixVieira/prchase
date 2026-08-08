import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, FolderTree } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Button } from "@/components/ui/button";
import { departmentsService } from "@/services/departments.service";
import { organizationsService } from "@/services/organizations.service";
import { departmentGroupsService } from "@/services/departmentGroups.service";
import { Department } from "@/types";
import { CreateDialog } from "./CreateDialog";
import { GroupSection } from "./GroupSection";
import { GroupsDialog } from "./GroupsDialog";
import { PermissionsDialog } from "./PermissionsDialog";
import { OrganizationsDialog } from "./OrganizationsDialog";

export default function DepartmentsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const [permissionsTarget, setPermissionsTarget] = useState<Department | null>(null);
  const [organizationsTarget, setOrganizationsTarget] = useState<Department | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["departments", "page"], queryFn: () => departmentsService.list({ limit: 100 }) });
  const { data: catalog } = useQuery({ queryKey: ["departments", "permission-catalog"], queryFn: () => departmentsService.listAllPermissions() });
  const { data: organizations } = useQuery({ queryKey: ["organizations", "active"], queryFn: () => organizationsService.listActive() });
  const { data: groups } = useQuery({ queryKey: ["department-groups"], queryFn: () => departmentGroupsService.list() });

  // Departamentos organizados por grupo (ex.: todos os departamentos de uma
  // mesma filial sob o mesmo rótulo), com os sem grupo numa seção à parte no
  // final — evita que sumam da tela quando nenhum grupo se aplica a eles.
  const sections = useMemo(() => {
    const departments = data?.items ?? [];
    const grouped = (groups ?? []).map((group) => ({
      key: group.id,
      title: group.name,
      subtitle: group.organization?.name,
      departments: departments.filter((d) => d.departmentGroupId === group.id),
    }));
    const ungrouped = departments.filter((d) => !d.departmentGroupId);
    return ungrouped.length > 0
      ? [...grouped, { key: "ungrouped", title: "Sem grupo", subtitle: undefined, departments: ungrouped }]
      : grouped;
  }, [data, groups]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: "Departamentos" }]} />
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setGroupsOpen(true)}><FolderTree className="h-4 w-4" /> Grupos</Button>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Novo Departamento</Button>
        </div>
      </div>

      <div className="space-y-6">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && sections.length === 0 && <p className="text-sm text-muted-foreground">Nenhum departamento cadastrado.</p>}
        {sections.map((section) => (
          <GroupSection
            key={section.key}
            title={section.title}
            subtitle={section.subtitle}
            departments={section.departments}
            onManagePermissions={setPermissionsTarget}
            onManageOrganizations={setOrganizationsTarget}
          />
        ))}
      </div>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <GroupsDialog open={groupsOpen} onOpenChange={setGroupsOpen} />
      <PermissionsDialog
        department={permissionsTarget}
        catalog={catalog}
        onOpenChange={(open) => !open && setPermissionsTarget(null)}
        onDepartmentChange={setPermissionsTarget}
      />
      <OrganizationsDialog
        department={organizationsTarget}
        organizations={organizations}
        onOpenChange={(open) => !open && setOrganizationsTarget(null)}
      />
    </div>
  );
}
