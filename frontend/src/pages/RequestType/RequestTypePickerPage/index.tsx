import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { requestTypesService } from "@/services/requestTypes.service";
import { DynamicIcon } from "@/lib/dynamicIcon";
import { RequestType, RequestTypeSourceKind } from "@/types";

export default function RequestTypePickerPage() {
  const navigate = useNavigate();

  const { data: requestTypes, isLoading } = useQuery({
    queryKey: ["request-types", "active"],
    queryFn: () => requestTypesService.listActive(),
  });

  const handleSelect = (requestType: RequestType) => {
    if (requestType.sourceKind === RequestTypeSourceKind.PURCHASE_REQUEST) {
      navigate("/purchase-requests/new");
    } else {
      navigate(`/requests/new/${requestType.id}`);
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumb items={[{ label: "Nova Solicitação" }]} />
      <div>
        <h1 className="text-lg font-semibold">Nova Solicitação</h1>
        <p className="text-sm text-muted-foreground">Escolha o tipo de solicitação que deseja abrir.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      )}

      {!isLoading && (requestTypes?.length ?? 0) === 0 && (
        <EmptyState icon={LayoutGrid} title="Nenhum tipo de solicitação disponível" description="Peça a um administrador para cadastrar um tipo de solicitação em Tipos de Solicitação." />
      )}

      {!isLoading && (requestTypes?.length ?? 0) > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {requestTypes!.map((requestType) => (
            <Card
              key={requestType.id}
              className="cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent/40"
              onClick={() => handleSelect(requestType)}
            >
              <CardContent className="flex flex-col items-center gap-2 pt-6 pb-5 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <DynamicIcon name={requestType.icon} className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium">{requestType.name}</p>
                {requestType.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{requestType.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
