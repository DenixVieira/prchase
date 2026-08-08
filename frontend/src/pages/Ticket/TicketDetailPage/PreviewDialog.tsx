import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ticketsService } from "@/services/tickets.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { downloadBlob } from "@/lib/utils";
import { AttachmentPreviewState } from "./useAttachmentPreview";

interface PreviewDialogProps {
  ticketId: string;
  preview: AttachmentPreviewState | null;
  onClose: () => void;
}

export function PreviewDialog({ ticketId, preview, onClose }: PreviewDialogProps) {
  const { showToast } = useToast();

  const handleDownload = async () => {
    if (!preview) return;
    try {
      const blob = await ticketsService.downloadAttachment(ticketId, preview.attachment.id);
      downloadBlob(blob, preview.attachment.originalName);
    } catch (error) {
      showToast({ title: "Erro ao baixar anexo", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!preview} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{preview?.attachment.originalName}</DialogTitle>
        </DialogHeader>
        {preview && (
          <div className="space-y-3">
            {preview.attachment.mimeType.startsWith("image/") ? (
              <img
                src={preview.url}
                alt={preview.attachment.originalName}
                className="max-h-[70vh] w-full rounded-md border border-border object-contain"
              />
            ) : preview.attachment.mimeType === "application/pdf" ? (
              <iframe
                src={preview.url}
                title={preview.attachment.originalName}
                className="h-[70vh] w-full rounded-md border border-border"
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Pré-visualização não disponível para este tipo de arquivo. Baixe o arquivo para visualizá-lo.
              </p>
            )}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Baixar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
