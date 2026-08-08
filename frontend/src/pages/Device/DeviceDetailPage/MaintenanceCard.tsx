import { useState } from "react";
import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { formatDateOnly } from "@/lib/utils";
import { Device, PermissionKey } from "@/types";
import { RegisterMaintenanceDialog } from "./RegisterMaintenanceDialog";

export function MaintenanceCard({ device }: { device: Device }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const maintenances = device.maintenances ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Manutenções</CardTitle>
        <PermissionGate permissions={[PermissionKey.REGISTER_DEVICE_MAINTENANCE]}>
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Wrench className="h-4 w-4" /> Registrar Manutenção
          </Button>
        </PermissionGate>
      </CardHeader>
      <CardContent className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {maintenances.map((maintenance) => (
          <div key={maintenance.id} className="border-b border-border pb-2 last:border-0 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="font-medium">
                Enviado em {formatDateOnly(maintenance.sentDate)}
                {maintenance.returnDate ? ` — retornou em ${formatDateOnly(maintenance.returnDate)}` : " — em aberto"}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{maintenance.registeredBy?.name}</span>
            </div>
            <p className="text-muted-foreground">{maintenance.reason}</p>
          </div>
        ))}
        {maintenances.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma manutenção registrada.</p>}
      </CardContent>

      <RegisterMaintenanceDialog deviceId={device.id} open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}
