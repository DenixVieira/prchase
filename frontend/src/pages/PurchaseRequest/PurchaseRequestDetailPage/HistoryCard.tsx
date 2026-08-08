import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { purchaseRequestsService } from "@/services/purchaseRequests.service";
import { formatDate } from "@/lib/utils";

export function HistoryCard({ purchaseRequestId }: { purchaseRequestId: string }) {
  const { data: history } = useQuery({
    queryKey: ["purchase-requests", purchaseRequestId, "history"],
    queryFn: () => purchaseRequestsService.getHistory(purchaseRequestId),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {(history ?? []).map((entry) => (
          <div key={entry.id} className="flex justify-between border-b border-border pb-2 last:border-0 text-sm">
            <span>{entry.description}</span>
            <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDate(entry.createdAt)}</span>
          </div>
        ))}
        {(history ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem histórico ainda.</p>}
      </CardContent>
    </Card>
  );
}
