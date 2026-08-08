import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardOverview } from "@/services/dashboard.service";
import { CARD_CONFIG } from "./constants";

interface StatCardsProps {
  data?: DashboardOverview;
  isLoading: boolean;
}

export function StatCards({ data, isLoading }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
      {CARD_CONFIG.map((card) => (
        <Card key={card.key}>
          <CardContent className="pt-6">
            <card.icon className={`h-5 w-5 mb-2 ${card.color}`} />
            {isLoading ? <Skeleton className="h-6 w-12" /> : <p className="text-2xl font-semibold">{data?.cards[card.key] ?? 0}</p>}
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
