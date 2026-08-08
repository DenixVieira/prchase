import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { extractErrorMessage } from "@/services/api";
import { useToast } from "./useToast";

/**
 * Telas de "detalhe" (ticket, solicitação) ficavam presas no skeleton de
 * carregamento para sempre quando o registro não existe ou o usuário não tem
 * acesso (organização diferente, por exemplo): isLoading vira false, mas os
 * dados nunca chegam, e o guard `isLoading || !data` continua verdadeiro
 * indefinidamente. Este hook redireciona de volta com um aviso assim que a
 * query falha (404 ou 403).
 */
export function useRedirectOnQueryError(isError: boolean, error: unknown, redirectTo: string) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isError) return;
    showToast({
      title: "Não foi possível abrir este registro",
      description: extractErrorMessage(error),
      variant: "destructive",
    });
    navigate(redirectTo, { replace: true });
  }, [isError, error, navigate, redirectTo, showToast]);
}
