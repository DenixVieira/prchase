import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requestTypesService } from "@/services/requestTypes.service";
import { departmentsService } from "@/services/departments.service";
import { organizationsService } from "@/services/organizations.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { RequestType } from "@/types";
import { OrganizationsCheckboxList } from "./OrganizationsCheckboxList";
import { DepartmentsCheckboxList } from "./DepartmentsCheckboxList";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  description: z.string().optional(),
  departmentId: z.string().uuid("Selecione o departamento responsável"),
  icon: z.string().optional(),
  isActive: z.boolean(),
});
type FormData = z.infer<typeof schema>;

interface EditDialogProps {
  requestType: RequestType | null;
  onOpenChange: (open: boolean) => void;
}

export function EditDialog({ requestType, onOpenChange }: EditDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [organizationIds, setOrganizationIds] = useState<string[]>([]);
  const [visibleDepartmentIds, setVisibleDepartmentIds] = useState<string[]>([]);

  const { data: departments } = useQuery({ queryKey: ["departments", "active"], queryFn: () => departmentsService.listActive() });
  const { data: organizations } = useQuery({ queryKey: ["organizations", "active"], queryFn: () => organizationsService.listActive() });

  useEffect(() => {
    if (requestType) {
      reset({
        name: requestType.name,
        description: requestType.description ?? "",
        departmentId: requestType.departmentId ?? "",
        icon: requestType.icon ?? "",
        isActive: requestType.isActive,
      });
      setOrganizationIds((requestType.organizations ?? []).map((o) => o.id));
      setVisibleDepartmentIds((requestType.visibleDepartments ?? []).map((d) => d.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestType]);

  const onEdit = async (formData: FormData) => {
    if (!requestType) return;
    try {
      await requestTypesService.update(requestType.id, { ...formData, organizationIds, visibleDepartmentIds });
      showToast({ title: "Tipo de solicitação atualizado", variant: "success" });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["request-types"] });
    } catch (error) {
      showToast({ title: "Erro ao atualizar", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!requestType} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Tipo de Solicitação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onEdit)} className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Descrição (opcional)</Label>
            <Textarea rows={2} {...register("description")} />
          </div>
          <div className="space-y-1">
            <Label>Departamento responsável</Label>
            <Controller
              control={control}
              name="departmentId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione o departamento" /></SelectTrigger>
                  <SelectContent>
                    {(departments ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
          </div>
          <div className="space-y-1">
            <Label>Ícone (opcional)</Label>
            <Input {...register("icon")} placeholder="Nome de um ícone lucide-react, ex.: Wrench" />
          </div>
          <OrganizationsCheckboxList organizations={organizations} value={organizationIds} onChange={setOrganizationIds} />
          <DepartmentsCheckboxList departments={departments} value={visibleDepartmentIds} onChange={setVisibleDepartmentIds} />
          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <Label>Ativo</Label>
              <p className="text-xs text-muted-foreground">Tipos inativos somem do card de Nova Solicitação.</p>
            </div>
            <Controller control={control} name="isActive" render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )} />
          </div>
          <DialogFooter><Button type="submit" isLoading={isSubmitting}>Salvar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
