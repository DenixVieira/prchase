import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardOverview } from "@/services/dashboard.service";
import { formatDate } from "@/lib/utils";

interface RecentActivityProps {
  data?: DashboardOverview;
  isLoading: boolean;
}

export function RecentActivity({ data, isLoading }: RecentActivityProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Últimas Movimentações</CardTitle></CardHeader>
        <CardContent className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {(data?.recentMovements ?? []).map((movement) => (
            <div key={movement.id} className="flex justify-between border-b border-border pb-2 last:border-0 text-sm">
              <span>{movement.description}</span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatDate(movement.createdAt)}</span>
            </div>
          ))}
          {!isLoading && (data?.recentMovements ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma movimentação recente.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notificações Recentes</CardTitle></CardHeader>
        <CardContent className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {(data?.recentNotifications ?? []).map((notification) => (
            <div key={notification.id} className="border-b border-border pb-2 last:border-0">
              <p className="text-sm font-medium">{notification.title}</p>
              <p className="text-xs text-muted-foreground">{notification.message}</p>
            </div>
          ))}
          {!isLoading && (data?.recentNotifications ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma notificação recente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
