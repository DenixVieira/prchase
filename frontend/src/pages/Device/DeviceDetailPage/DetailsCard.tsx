import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateOnly } from "@/lib/utils";
import { Device } from "@/types";

function Info({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}

export function DetailsCard({ device }: { device: Device }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Detalhes</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm">
        <Info label="Modelo" value={device.model} />
        <Info label="Marca" value={device.brand} />
        <Info label="Nº de Série" value={device.serialNumber} />
        <Info label="MAC" value={device.mac} />
        <Info label="Organização" value={device.organization?.name} />
        <Info label="Departamento" value={device.department?.name} />
        <Info label="Data da Compra" value={formatDateOnly(device.purchaseDate)} />
        <Info label="Validade da Garantia" value={formatDateOnly(device.warrantyExpiration)} />
        <div className="col-span-2"><Info label="Funcionário" value={device.assignedToName || "Uso coletivo"} /></div>
      </CardContent>
    </Card>
  );
}
