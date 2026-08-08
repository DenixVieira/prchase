import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Button } from "@/components/ui/button";
import { organizationsService } from "@/services/organizations.service";
import { Organization } from "@/types";
import { CreateDialog } from "./CreateDialog";
import { EditDialog } from "./EditDialog";
import { OrganizationCard } from "./OrganizationCard";

export default function OrganizationsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Organization | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["organizations", "page"], queryFn: () => organizationsService.list({ limit: 100 }) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: "Organizações" }]} />
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Nova Organização</Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Organizações representam unidades/sites aos quais solicitações de compra e tickets pertencem. A configuração
        de quais organizações cada departamento acessa é feita na tela de Departamentos.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {(data?.items ?? []).map((organization) => (
          <OrganizationCard key={organization.id} organization={organization} onEdit={() => setEditTarget(organization)} />
        ))}
      </div>

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditDialog organization={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
    </div>
  );
}
