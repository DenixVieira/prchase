import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { purchaseRequestsService } from "@/services/purchaseRequests.service";
import { organizationsService } from "@/services/organizations.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { Priority, PurchaseRequestStatus } from "@/types";

const schema = z.object({
  organizationId: z.string().uuid("Selecione a organização"),
  costCenter: z.string().min(1, "Informe o centro de custo"),
  supplier: z.string().min(1, "Informe o fornecedor"),
  category: z.string().min(1, "Informe a categoria"),
  description: z.string().min(5, "Descreva a solicitação com pelo menos 5 caracteres"),
  justification: z.string().min(5, "Justifique a compra com pelo menos 5 caracteres"),
  estimatedValue: z.coerce.number().positive("Informe um valor estimado válido"),
  priority: z.nativeEnum(Priority),
  observations: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: "Baixa", [Priority.MEDIUM]: "Média", [Priority.HIGH]: "Alta", [Priority.URGENT]: "Urgente",
};

export default function PurchaseRequestFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const { data: organizations, isLoading: loadingOrganizations } = useQuery({
    queryKey: ["organizations", "my-accessible"],
    queryFn: () => organizationsService.myAccessible(),
  });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["purchase-requests", id],
    queryFn: () => purchaseRequestsService.findOne(id!),
    enabled: isEditMode,
  });

  const { register, handleSubmit, control, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: Priority.MEDIUM },
  });

  // Pré-seleciona a organização principal do departamento, quando ela está
  // entre as organizações que o usuário pode escolher; o usuário ainda pode
  // trocar livremente entre as demais opções disponíveis. Só se aplica na
  // criação — na edição, a organização já vem preenchida abaixo e não pode
  // ser trocada (ela não faz parte do payload de update).
  useEffect(() => {
    if (isEditMode) return;
    if (!organizations || organizations.length === 0) return;
    const homeId = user?.department?.homeOrganization?.id;
    const preselected = homeId && organizations.some((o) => o.id === homeId) ? homeId : organizations[0].id;
    setValue("organizationId", preselected);
  }, [isEditMode, organizations, user, setValue]);

  // Preenche o formulário com os dados da solicitação existente ao entrar em modo de edição.
  useEffect(() => {
    if (!existing) return;
    reset({
      organizationId: existing.organizationId ?? "",
      costCenter: existing.costCenter,
      supplier: existing.supplier,
      category: existing.category,
      description: existing.description,
      justification: existing.justification,
      estimatedValue: Number(existing.estimatedValue),
      priority: existing.priority,
      observations: existing.observations ?? "",
    });
  }, [existing, reset]);

  const isOwner = !isEditMode || existing?.requesterId === user?.id;
  const isDraft = !isEditMode || existing?.status === PurchaseRequestStatus.DRAFT;
  const canEditThis = isOwner && isDraft;

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode) {
        // organizationId não faz parte do payload de edição — a organização
        // é definida na criação e não pode ser alterada depois.
        const { organizationId: _organizationId, ...updatePayload } = data;
        await purchaseRequestsService.update(id!, updatePayload);
        showToast({ title: "Solicitação atualizada", variant: "success" });
        navigate(`/purchase-requests/${id}`);
      } else {
        const created = await purchaseRequestsService.create(data);
        showToast({ title: "Solicitação criada em rascunho", variant: "success" });
        navigate(`/purchase-requests/${created.id}`);
      }
    } catch (error) {
      showToast({ title: isEditMode ? "Erro ao salvar alterações" : "Erro ao criar solicitação", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const hasDepartment = !!user?.department;
  const hasOrganizationOptions = !loadingOrganizations && (organizations?.length ?? 0) > 0;
  const canSubmit = isEditMode ? canEditThis : hasDepartment && hasOrganizationOptions;

  if (isEditMode && loadingExisting) {
    return <div className="space-y-4 max-w-3xl"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Breadcrumb items={[{ label: "Solicitações de Compra", to: "/purchase-requests" }, { label: isEditMode ? `Editar ${existing?.number ?? ""}` : "Nova Solicitação" }]} />

      {isEditMode && !canEditThis && (
        <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {!isOwner ? "Você só pode editar suas próprias solicitações." : "Somente solicitações em rascunho podem ser editadas."}
        </div>
      )}
      {!isEditMode && !hasDepartment && (
        <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Você não está vinculado a nenhum departamento. Contate o administrador antes de criar uma solicitação.
        </div>
      )}
      {!isEditMode && hasDepartment && !loadingOrganizations && !hasOrganizationOptions && (
        <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Seu departamento não tem acesso a nenhuma organização. Contate o administrador antes de criar uma solicitação.
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Departamento Solicitante</Label>
                <Input value={(isEditMode ? existing?.department?.name : user?.department?.name) ?? "Sem departamento"} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Organização</Label>
                {isEditMode ? (
                  // A organização é fixada na criação e não pode ser trocada depois.
                  <Input value={existing?.organization?.name ?? "—"} disabled />
                ) : (
                  <Controller
                    control={control}
                    name="organizationId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={!hasOrganizationOptions}>
                        <SelectTrigger><SelectValue placeholder="Selecione a organização" /></SelectTrigger>
                        <SelectContent>
                          {(organizations ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  />
                )}
                {errors.organizationId && <p className="text-xs text-destructive">{errors.organizationId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Centro de Custo</Label>
                <Input {...register("costCenter")} />
                {errors.costCenter && <p className="text-xs text-destructive">{errors.costCenter.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Fornecedor</Label>
                <Input {...register("supplier")} />
                {errors.supplier && <p className="text-xs text-destructive">{errors.supplier.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input {...register("category")} />
                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Valor Estimado (R$)</Label>
                <Input type="number" step="0.01" {...register("estimatedValue")} />
                {errors.estimatedValue && <p className="text-xs text-destructive">{errors.estimatedValue.message}</p>}
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Prioridade</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(Priority).map((p) => <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea rows={3} {...register("description")} />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Justificativa</Label>
              <Textarea rows={3} {...register("justification")} />
              {errors.justification && <p className="text-xs text-destructive">{errors.justification.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Observações (opcional)</Label>
              <Textarea rows={2} {...register("observations")} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting} disabled={!canSubmit}>
                {isEditMode ? "Salvar Alterações" : "Salvar Rascunho"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
