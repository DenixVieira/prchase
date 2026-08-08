import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ListChecks, Pencil, Rows3, Lock } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { requestTypesService } from "@/services/requestTypes.service";
import { DynamicIcon } from "@/lib/dynamicIcon";
import { RequestType } from "@/types";
import { CreateDialog } from "./CreateDialog";
import { EditDialog } from "./EditDialog";
import { FieldsBuilder } from "./FieldsBuilder";

export default function RequestTypesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RequestType | null>(null);
  const [fieldsTarget, setFieldsTarget] = useState<RequestType | null>(null);

  const { data: requestTypes, isLoading } = useQuery({
    queryKey: ["request-types", "all"],
    queryFn: () => requestTypesService.listAll(),
  });

  const handleRemove = async (requestType: RequestType) => {
    try {
      await requestTypesService.remove(requestType.id);
      showToast({ title: "Tipo de solicitação removido", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["request-types"] });
    } catch (error) {
      showToast({ title: "Erro ao remover", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: "Tipos de Solicitação" }]} />
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Novo Tipo</Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {!isLoading && (requestTypes?.length ?? 0) === 0 && (
        <EmptyState icon={ListChecks} title="Nenhum tipo de solicitação cadastrado" description="Crie um tipo pra que ele apareça como card em Nova Solicitação." />
      )}

      {!isLoading && (requestTypes?.length ?? 0) > 0 && (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Organizações</TableHead>
                <TableHead>Campos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestTypes!.map((requestType) => {
                return (
                  <TableRow key={requestType.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DynamicIcon name={requestType.icon} className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{requestType.name}</span>
                        {requestType.isBuiltIn && (
                          <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Fixo</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{requestType.department?.name ?? "—"}</TableCell>
                    <TableCell>
                      {requestType.isBuiltIn ? (
                        <span className="text-xs text-muted-foreground">Todas</span>
                      ) : (requestType.organizations?.length ?? 0) === 0 ? (
                        <Badge variant="warning">Oculto — sem organização</Badge>
                      ) : (
                        <span className="text-xs">
                          {requestType.organizations!.map((o) => o.name).join(", ")}
                          {(requestType.visibleDepartments?.length ?? 0) > 0 && (
                            <span className="text-muted-foreground"> · restrito a {requestType.visibleDepartments!.length} depto(s)</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{requestType.fields?.length ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={requestType.isActive ? "success" : "secondary"}>
                        {requestType.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        {!requestType.isBuiltIn && (
                          <Button variant="outline" size="sm" onClick={() => setFieldsTarget(requestType)}>
                            <Rows3 className="h-3.5 w-3.5" /> Campos
                          </Button>
                        )}
                        {!requestType.isBuiltIn && (
                          <Button variant="outline" size="sm" onClick={() => setEditTarget(requestType)}>
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </Button>
                        )}
                        {!requestType.isBuiltIn && (
                          <ConfirmDialog
                            trigger={<Button variant="destructive" size="sm">Excluir</Button>}
                            title="Excluir tipo de solicitação"
                            description={`Tem certeza que deseja excluir "${requestType.name}"? Tickets já criados a partir dele permanecem intactos.`}
                            confirmLabel="Excluir"
                            variant="destructive"
                            onConfirm={() => handleRemove(requestType)}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditDialog requestType={editTarget} onOpenChange={(open) => !open && setEditTarget(null)} />
      <FieldsBuilder requestType={fieldsTarget} onOpenChange={(open) => !open && setFieldsTarget(null)} />
    </div>
  );
}
