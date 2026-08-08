import { useState } from "react";
import { ticketsService } from "@/services/tickets.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Attachment } from "@/types";

export interface AttachmentPreviewState {
  attachment: Attachment;
  url: string;
}

/** Busca o anexo (autenticado) e monta a URL de objeto usada pelo modal de
 * pré-visualização — compartilhado entre o card de Nota Fiscal e o de Anexos. */
export function useAttachmentPreview(ticketId: string) {
  const { showToast } = useToast();
  const [preview, setPreview] = useState<AttachmentPreviewState | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePreview = async (attachment: Attachment) => {
    if (isLoadingPreview) return;
    setIsLoadingPreview(true);
    try {
      const blob = await ticketsService.viewAttachment(ticketId, attachment.id);
      const url = window.URL.createObjectURL(blob);
      setPreview({ attachment, url });
    } catch (error) {
      showToast({ title: "Erro ao visualizar anexo", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const closePreview = () => {
    if (preview) window.URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  return { preview, isLoadingPreview, handlePreview, closePreview };
}
