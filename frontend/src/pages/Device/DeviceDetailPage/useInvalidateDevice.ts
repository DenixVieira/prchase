import { useQueryClient } from "@tanstack/react-query";

/** Invalida o cache de equipamentos (lista e detalhe) após qualquer mutação. */
export function useInvalidateDevice() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["devices"] });
}
