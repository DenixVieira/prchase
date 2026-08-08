import { useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { WarrantyBadge } from "@/components/shared/WarrantyBadge";
import { devicesService } from "@/services/devices.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Device, PermissionKey } from "@/types";
import { useInvalidateDevice } from "./useInvalidateDevice";

export function HeaderCard({ device }: { device: Device }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const invalidate = useInvalidateDevice();

  const handleDelete = async () => {
    try {
      await devicesService.remove(device.id);
      invalidate();
      showToast({ title: "Equipamento excluído", variant: "success" });
      navigate("/devices");
    } catch (error) {
      showToast({ title: "Erro ao excluir equipamento", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-lg truncate">{device.name || device.model}</CardTitle>
            <WarrantyBadge warrantyExpiration={device.warrantyExpiration} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PermissionGate permissions={[PermissionKey.EDIT_DEVICE]}>
              <Button size="sm" variant="outline" onClick={() => navigate(`/devices/${device.id}/edit`)}>
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            </PermissionGate>
            <PermissionGate permissions={[PermissionKey.DELETE_DEVICE]}>
              <ConfirmDialog
                trigger={<Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Excluir</Button>}
                title="Excluir equipamento"
                description={`Tem certeza que deseja excluir o equipamento "${device.name || device.serialNumber}"? Esta ação não pode ser desfeita.`}
                confirmLabel="Excluir"
                variant="destructive"
                onConfirm={handleDelete}
              />
            </PermissionGate>
          </div>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{device.serialNumber}</span>
      </CardHeader>
    </Card>
  );
}
