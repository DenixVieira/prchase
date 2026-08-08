import { useState } from "react";
import { devicesService } from "@/services/devices.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { DeviceAttachment } from "@/types";

export interface AttachmentPreviewState {
  attachment: DeviceAttachment;
  url: string;
}

/** Busca o anexo (autenticado) e monta a URL de objeto usada pelo modal de pré-visualização. */
export function useAttachmentPreview(deviceId: string) {
  const { showToast } = useToast();
  const [preview, setPreview] = useState<AttachmentPreviewState | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handlePreview = async (attachment: DeviceAttachment) => {
    if (isLoadingPreview) return;
    setIsLoadingPreview(true);
    try {
      const blob = await devicesService.viewAttachment(deviceId, attachment.id);
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
