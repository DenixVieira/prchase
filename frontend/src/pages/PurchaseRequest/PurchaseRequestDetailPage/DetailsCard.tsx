import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PurchaseRequestStatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { UserNameTag } from "@/components/shared/UserNameTag";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PurchaseRequest } from "@/types";
import { Info } from "./Info";

export function DetailsCard({ purchaseRequest }: { purchaseRequest: PurchaseRequest }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{purchaseRequest.supplier} — {purchaseRequest.category}</CardTitle>
        <div className="flex gap-2">
          <PriorityBadge priority={purchaseRequest.priority} />
          <PurchaseRequestStatusBadge status={purchaseRequest.status} />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <Info label="Número" value={purchaseRequest.number} />
        <Info label="Departamento" value={purchaseRequest.department?.name} />
        <Info label="Organização" value={purchaseRequest.organization?.name} />
        <Info label="Solicitante" value={<UserNameTag user={purchaseRequest.requester} />} />
        <Info label="Centro de Custo" value={purchaseRequest.costCenter} />
        <Info label="Valor Estimado" value={formatCurrency(purchaseRequest.estimatedValue)} />
        <Info label="Data" value={formatDate(purchaseRequest.createdAt)} />
        <div className="col-span-2"><Info label="Descrição" value={purchaseRequest.description} /></div>
        <div className="col-span-2"><Info label="Justificativa" value={purchaseRequest.justification} /></div>
        {purchaseRequest.observations && <div className="col-span-2"><Info label="Observações" value={purchaseRequest.observations} /></div>}
      </CardContent>
    </Card>
  );
}
