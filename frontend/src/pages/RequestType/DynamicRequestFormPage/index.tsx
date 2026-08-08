import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DynamicFormField } from "@/components/shared/DynamicFormField";
import { requestTypesService } from "@/services/requestTypes.service";
import { requestSubmissionsService } from "@/services/requestSubmissions.service";
import { organizationsService } from "@/services/organizations.service";
import { buildDynamicSchema, splitDynamicFormData } from "@/lib/dynamicForm";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

export default function DynamicRequestFormPage() {
  const { requestTypeId } = useParams<{ requestTypeId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const { data: requestType, isLoading } = useQuery({
    queryKey: ["request-types", requestTypeId],
    queryFn: () => requestTypesService.findOne(requestTypeId!),
    enabled: !!requestTypeId,
  });

  // Mesma organização que a Solicitação de Compra usa — escolhida pelo
  // usuário dentre as organizações que o próprio departamento acessa.
  const { data: organizations, isLoading: loadingOrganizations } = useQuery({
    queryKey: ["organizations", "my-accessible"],
    queryFn: () => organizationsService.myAccessible(),
  });

  // O tipo só permite algumas organizações (ver Tipos de Solicitação); dentre
  // elas, só as que o próprio departamento do usuário também acessa entram
  // no select — a mesma restrição que o backend valida na hora do envio.
  const eligibleOrganizations = useMemo(() => {
    const allowedIds = new Set((requestType?.organizations ?? []).map((o) => o.id));
    return (organizations ?? []).filter((o) => allowedIds.has(o.id));
  }, [organizations, requestType]);

  const fields = useMemo(() => [...(requestType?.fields ?? [])].sort((a, b) => a.order - b.order), [requestType]);
  const schema = useMemo(
    () => buildDynamicSchema(fields).extend({ organizationId: z.string().uuid("Selecione a organização") }),
    [fields]
  );

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
  });

  // Pré-seleciona a organização principal do departamento, quando ela está
  // entre as organizações que o usuário pode escolher — mesmo comportamento
  // do formulário de Solicitação de Compra.
  useEffect(() => {
    if (eligibleOrganizations.length === 0) return;
    const homeId = user?.department?.homeOrganization?.id;
    const preselected = homeId && eligibleOrganizations.some((o) => o.id === homeId) ? homeId : eligibleOrganizations[0].id;
    setValue("organizationId", preselected);
  }, [eligibleOrganizations, user, setValue]);

  const onSubmit = async (values: Record<string, unknown>) => {
    if (!requestType) return;
    try {
      const { data, files } = splitDynamicFormData(fields, values);
      const ticket = await requestSubmissionsService.create(requestType.id, values.organizationId as string, data, files);
      showToast({ title: "Solicitação enviada", description: `Ticket ${ticket.protocol} criado.`, variant: "success" });
      navigate(`/tickets/${ticket.id}`);
    } catch (error) {
      showToast({ title: "Erro ao enviar solicitação", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const hasOrganizationOptions = !loadingOrganizations && eligibleOrganizations.length > 0;

  if (isLoading) {
    return <div className="space-y-4 max-w-3xl"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!requestType) {
    return <p className="text-sm text-muted-foreground">Tipo de solicitação não encontrado.</p>;
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <Breadcrumb items={[{ label: "Nova Solicitação", to: "/requests/new" }, { label: requestType.name }]} />
      <div>
        <h1 className="text-lg font-semibold">{requestType.name}</h1>
        {requestType.description && <p className="text-sm text-muted-foreground">{requestType.description}</p>}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Organização</Label>
              <Controller
                control={control}
                name="organizationId"
                render={({ field }) => (
                  <Select value={(field.value as string) ?? ""} onValueChange={field.onChange} disabled={!hasOrganizationOptions}>
                    <SelectTrigger><SelectValue placeholder="Selecione a organização" /></SelectTrigger>
                    <SelectContent>
                      {eligibleOrganizations.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.organizationId && <p className="text-xs text-destructive">{errors.organizationId.message as string}</p>}
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground">Este tipo de solicitação ainda não tem campos cadastrados.</p>
            )}
            {fields.map((field) => (
              <DynamicFormField key={field.id} field={field} control={control} errors={errors} />
            ))}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate("/requests/new")}>Cancelar</Button>
              <Button type="submit" isLoading={isSubmitting} disabled={!hasOrganizationOptions}>Enviar Solicitação</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
