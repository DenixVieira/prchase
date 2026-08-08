import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { purchaseRequestsService } from "@/services/purchaseRequests.service";
import { useRedirectOnQueryError } from "@/hooks/useRedirectOnQueryError";
import { ActionsBar } from "./ActionsBar";
import { DetailsCard } from "./DetailsCard";
import { HistoryCard } from "./HistoryCard";

export default function PurchaseRequestDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: purchaseRequest, isLoading, isError, error } = useQuery({
    queryKey: ["purchase-requests", id],
    queryFn: () => purchaseRequestsService.findOne(id!),
    enabled: !!id,
  });
  // Solicitação inexistente ou de organização sem acesso: volta para a
  // listagem em vez de deixar a tela presa no skeleton indefinidamente.
  useRedirectOnQueryError(isError, error, "/purchase-requests");

  if (isLoading || !purchaseRequest) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Breadcrumb items={[{ label: "Solicitações de Compra", to: "/purchase-requests" }, { label: purchaseRequest.number }]} />
        <ActionsBar purchaseRequest={purchaseRequest} />
      </div>

      <DetailsCard purchaseRequest={purchaseRequest} />
      <HistoryCard purchaseRequestId={purchaseRequest.id} />
    </div>
  );
}
