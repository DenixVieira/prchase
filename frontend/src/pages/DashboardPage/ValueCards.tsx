import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardOverview } from "@/services/dashboard.service";
import { formatCurrency } from "@/lib/utils";
import { VALUE_CARD_CONFIG } from "./constants";

interface ValueCardsProps {
  data?: DashboardOverview;
  isLoading: boolean;
}

export function ValueCards({ data, isLoading }: ValueCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {VALUE_CARD_CONFIG.map((card) => (
        <Card key={card.key} className={`border-t-4 ${card.accent}`}>
          <CardContent className="pt-6">
            <card.icon className={`h-5 w-5 mb-2 ${card.color}`} />
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(data?.values[card.key] ?? 0)}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
