import { useQueryClient } from "@tanstack/react-query";

/** Invalida o cache de tickets (lista, board, detalhe) após qualquer mutação. */
export function useInvalidateTicket() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["tickets"] });
}
