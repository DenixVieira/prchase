import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { devicesService } from "@/services/devices.service";
import { departmentsService } from "@/services/departments.service";
import { organizationsService } from "@/services/organizations.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { isHomeOrganization } from "@/lib/departmentOrganization";

const schema = z.object({
  name: z.string().optional(),
  serialNumber: z.string().min(1, "Informe o número de série"),
  mac: z.string().optional(),
  model: z.string().min(1, "Informe o modelo"),
  brand: z.string().min(1, "Informe a marca"),
  purchaseDate: z.string().min(1, "Informe a data da compra"),
  warrantyExpiration: z.string().min(1, "Informe a validade da garantia"),
  organizationId: z.string().uuid("Selecione a organização"),
  departmentId: z.string().uuid("Selecione o departamento"),
  assignedToName: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function DeviceFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Só organizações que o usuário logado pode acessar — mesma regra usada
  // ao criar uma solicitação de compra.
  const { data: organizations } = useQuery({ queryKey: ["organizations", "my-accessible"], queryFn: () => organizationsService.myAccessible() });
  const { data: departments } = useQuery({ queryKey: ["departments", "active"], queryFn: () => departmentsService.listActive() });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["devices", id],
    queryFn: () => devicesService.findOne(id!),
    enabled: isEditMode,
  });

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedOrganizationId = watch("organizationId");
  // Departamento só pode ser um dos que têm a organização escolhida como principal.
  const departmentOptions = (departments ?? []).filter(
    (d) => selectedOrganizationId && isHomeOrganization(d, selectedOrganizationId)
  );

  useEffect(() => {
    if (!existing) return;
    reset({
      name: existing.name ?? "",
      serialNumber: existing.serialNumber,
      mac: existing.mac ?? "",
      model: existing.model,
      brand: existing.brand,
      purchaseDate: existing.purchaseDate,
      warrantyExpiration: existing.warrantyExpiration,
      organizationId: existing.organizationId,
      departmentId: existing.departmentId,
      assignedToName: existing.assignedToName ?? "",
    });
  }, [existing, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode) {
        const device = await devicesService.update(id!, data);
        showToast({ title: "Equipamento atualizado", variant: "success" });
        navigate(`/devices/${device.id}`);
      } else {
        const device = await devicesService.create(data);
        showToast({ title: "Equipamento cadastrado", variant: "success" });
        navigate(`/devices/${device.id}`);
      }
    } catch (error) {
      showToast({ title: isEditMode ? "Erro ao salvar alterações" : "Erro ao cadastrar equipamento", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  if (isEditMode && loadingExisting) {
    return <div className="space-y-4 max-w-3xl"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Breadcrumb items={[{ label: "Equipamentos", to: "/devices" }, { label: isEditMode ? `Editar ${existing?.serialNumber ?? ""}` : "Novo Equipamento" }]} />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Nome/Apelido (opcional)</Label>
                <Input placeholder="Ex.: Notebook Financeiro 01" {...register("name")} />
              </div>
              <div className="space-y-1.5">
                <Label>Número de Série</Label>
                <Input {...register("serialNumber")} />
                {errors.serialNumber && <p className="text-xs text-destructive">{errors.serialNumber.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>MAC (opcional)</Label>
                <Input placeholder="00:00:00:00:00:00" {...register("mac")} />
              </div>
              <div className="space-y-1.5">
                <Label>Modelo</Label>
                <Input {...register("model")} />
                {errors.model && <p className="text-xs text-destructive">{errors.model.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Input {...register("brand")} />
                {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Data da Compra</Label>
                <Input type="date" {...register("purchaseDate")} />
                {errors.purchaseDate && <p className="text-xs text-destructive">{errors.purchaseDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Validade da Garantia</Label>
                <Input type="date" {...register("warrantyExpiration")} />
                {errors.warrantyExpiration && <p className="text-xs text-destructive">{errors.warrantyExpiration.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Organização</Label>
                <Controller
                  control={control}
                  name="organizationId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => { field.onChange(value); setValue("departmentId", ""); }}
                    >
                      <SelectTrigger><SelectValue placeholder="Selecione a organização" /></SelectTrigger>
                      <SelectContent>
                        {(organizations ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.organizationId && <p className="text-xs text-destructive">{errors.organizationId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Departamento</Label>
                <Controller
                  control={control}
                  name="departmentId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={!selectedOrganizationId}>
                      <SelectTrigger><SelectValue placeholder={selectedOrganizationId ? "Selecione o departamento" : "Selecione a organização primeiro"} /></SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
                {selectedOrganizationId && departmentOptions.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum departamento tem esta organização como principal.</p>
                )}
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Funcionário (opcional — deixe em branco para uso coletivo)</Label>
                <Input {...register("assignedToName")} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting}>
                {isEditMode ? "Salvar Alterações" : "Cadastrar Equipamento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
