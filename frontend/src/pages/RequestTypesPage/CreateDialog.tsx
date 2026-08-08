import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { requestTypesService } from "@/services/requestTypes.service";
import { departmentsService } from "@/services/departments.service";
import { organizationsService } from "@/services/organizations.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { OrganizationsCheckboxList } from "./OrganizationsCheckboxList";
import { DepartmentsCheckboxList } from "./DepartmentsCheckboxList";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  description: z.string().optional(),
  departmentId: z.string().uuid("Selecione o departamento responsável"),
  icon: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [organizationIds, setOrganizationIds] = useState<string[]>([]);
  const [visibleDepartmentIds, setVisibleDepartmentIds] = useState<string[]>([]);

  const { data: departments } = useQuery({ queryKey: ["departments", "active"], queryFn: () => departmentsService.listActive() });
  const { data: organizations } = useQuery({ queryKey: ["organizations", "active"], queryFn: () => organizationsService.listActive() });

  const onCreate = async (formData: FormData) => {
    try {
      await requestTypesService.create({ ...formData, organizationIds, visibleDepartmentIds });
      showToast({ title: "Tipo de solicitação criado", variant: "success" });
      onOpenChange(false);
      reset();
      setOrganizationIds([]);
      setVisibleDepartmentIds([]);
      queryClient.invalidateQueries({ queryKey: ["request-types"] });
    } catch (error) {
      showToast({ title: "Erro ao criar tipo de solicitação", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo Tipo de Solicitação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input {...register("name")} placeholder="Ex.: Ordem de Serviço - T.I." />
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
            <p className="text-xs text-muted-foreground">Veja os nomes em lucide.dev/icons. Deixe em branco para um ícone padrão.</p>
          </div>
          <OrganizationsCheckboxList organizations={organizations} value={organizationIds} onChange={setOrganizationIds} />
          <DepartmentsCheckboxList departments={departments} value={visibleDepartmentIds} onChange={setVisibleDepartmentIds} />
          <DialogFooter><Button type="submit" isLoading={isSubmitting}>Criar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
