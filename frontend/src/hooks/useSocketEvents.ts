import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";
import { useToast } from "./useToast";
import { Notification } from "@/types";

/**
 * Escuta eventos globais do Socket.io e invalida as queries do TanStack Query
 * correspondentes, mantendo todos os clientes conectados sincronizados em tempo real.
 */
export function useSocketEvents() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (!socket) return;

    const invalidate = (keys: string[]) => queryClient.invalidateQueries({ queryKey: keys });

    const onNotification = (notification: Notification) => {
      showToast({ title: notification.title, description: notification.message, variant: "default" });
      invalidate(["notifications"]);
    };
    const onTicketUpdated = () => invalidate(["tickets"]);
    const onTicketMoved = () => invalidate(["tickets"]);
    const onTicketCreated = () => invalidate(["tickets"]);
    const onTicketCommented = () => invalidate(["tickets"]);
    const onPurchaseRequestUpdated = () => invalidate(["purchase-requests"]);

    socket.on("notification:new", onNotification);
    socket.on("ticket:updated", onTicketUpdated);
    socket.on("ticket:moved", onTicketMoved);
    socket.on("ticket:created", onTicketCreated);
    socket.on("ticket:commented", onTicketCommented);
    socket.on("purchase-request:updated", onPurchaseRequestUpdated);

    return () => {
      socket.off("notification:new", onNotification);
      socket.off("ticket:updated", onTicketUpdated);
      socket.off("ticket:moved", onTicketMoved);
      socket.off("ticket:created", onTicketCreated);
      socket.off("ticket:commented", onTicketCommented);
      socket.off("purchase-request:updated", onPurchaseRequestUpdated);
    };
  }, [socket, queryClient, showToast]);
}
