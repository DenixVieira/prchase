import { useMemo } from "react";
import { Bell, Check } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { notificationsService } from "@/services/notifications.service";
import { formatDate } from "@/lib/utils";

// O Socket.io já invalida a query "notifications" em tempo real assim que uma
// nova notificação chega (ver useSocketEvents), então o polling aqui é só uma
// rede de segurança para o caso de o socket cair — não precisa ser agressivo.
const SAFETY_NET_POLL_INTERVAL_MS = 120000;

export function NotificationBell() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsService.list(false),
    refetchInterval: SAFETY_NET_POLL_INTERVAL_MS,
  });

  // Contagem de não lidas derivada da própria lista já carregada, em vez de
  // uma segunda requisição/polling dedicado só para o número do badge.
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  const markAllAsRead = async () => {
    await notificationsService.markAllAsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleClick = async (id: string, link?: string | null) => {
    await notificationsService.markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    if (link) navigate(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllAsRead}>
              <Check className="h-3 w-3" /> Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">Nenhuma notificação por aqui.</p>
          )}
          {notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={notification.isRead ? "opacity-60" : ""}
              onClick={() => handleClick(notification.id, notification.link)}
            >
              <div className="flex flex-col gap-0.5 w-full">
                <span className="text-sm font-medium">{notification.title}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{notification.message}</span>
                <span className="text-[10px] text-muted-foreground">{formatDate(notification.createdAt)}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
