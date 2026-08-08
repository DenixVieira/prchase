import { Paperclip, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { FileUpload } from "@/components/shared/FileUpload";
import { devicesService } from "@/services/devices.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Device, DeviceAttachment, PermissionKey } from "@/types";
import { useInvalidateDevice } from "./useInvalidateDevice";

interface AttachmentsCardProps {
  device: Device;
  onPreview: (attachment: DeviceAttachment) => void;
}

export function AttachmentsCard({ device, onPreview }: AttachmentsCardProps) {
  const { showToast } = useToast();
  const invalidate = useInvalidateDevice();

  const handleUpload = async (file: File) => {
    await devicesService.uploadAttachment(device.id, file);
    invalidate();
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await devicesService.removeAttachment(device.id, attachmentId);
      invalidate();
      showToast({ title: "Anexo removido", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao remover anexo", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const attachments = device.attachments ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Anexos</CardTitle>
        <PermissionGate permissions={[PermissionKey.EDIT_DEVICE]}>
          <FileUpload onUpload={handleUpload} label="Anexar" />
        </PermissionGate>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
          >
            <button
              type="button"
              onClick={() => onPreview(attachment)}
              className="flex flex-1 min-w-0 items-center gap-2 truncate text-left"
            >
              <Paperclip className="h-4 w-4 shrink-0" /> <span className="truncate">{attachment.originalName}</span>
            </button>
            <div className="flex items-center gap-1 shrink-0">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <PermissionGate permissions={[PermissionKey.EDIT_DEVICE]}>
                <ConfirmDialog
                  trigger={
                    <button type="button" className="rounded p-1 hover:bg-background/80" aria-label="Excluir anexo">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  }
                  title="Excluir anexo"
                  description={`Tem certeza que deseja excluir o anexo "${attachment.originalName}"? Esta ação não pode ser desfeita.`}
                  confirmLabel="Excluir"
                  variant="destructive"
                  onConfirm={() => handleRemoveAttachment(attachment.id)}
                />
              </PermissionGate>
            </div>
          </div>
        ))}
        {attachments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum anexo.</p>}
      </CardContent>
    </Card>
  );
}
