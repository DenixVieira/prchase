import { api } from "./api";
import { Ticket } from "@/types";

/**
 * Envia uma solicitação dinâmica. `data` é serializado como JSON num único
 * campo de texto "data" (preserva number/boolean/array sem precisar achatar
 * chaves multipart) — arquivos de campos FILE vão à parte, cada um sob o
 * fieldname = key do campo (o backend casa por fieldname, ver
 * request-submissions.controller.ts). Retorna o Ticket recém-criado.
 */
export const requestSubmissionsService = {
  async create(requestTypeId: string, organizationId: string, data: Record<string, unknown>, files: Record<string, File>): Promise<Ticket> {
    const formData = new FormData();
    formData.append("requestTypeId", requestTypeId);
    formData.append("organizationId", organizationId);
    formData.append("data", JSON.stringify(data));
    for (const [fieldKey, file] of Object.entries(files)) {
      formData.append(fieldKey, file);
    }
    // Não definir Content-Type manualmente: o axios detecta o FormData e gera
    // o boundary multipart correto sozinho.
    const { data: response } = await api.post("/request-submissions", formData);
    return response.data;
  },
};
