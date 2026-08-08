import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { devicesService } from "@/services/devices.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { useInvalidateDevice } from "./useInvalidateDevice";

interface RegisterMaintenanceDialogProps {
  deviceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterMaintenanceDialog({ deviceId, open, onOpenChange }: RegisterMaintenanceDialogProps) {
  const { showToast } = useToast();
  const invalidate = useInvalidateDevice();
  const [sentDate, setSentDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => { setSentDate(""); setReturnDate(""); setReason(""); };

  const handleSubmit = async () => {
    if (!sentDate || !reason.trim()) return;
    setIsSubmitting(true);
    try {
      await devicesService.addMaintenance(deviceId, { sentDate, returnDate: returnDate || undefined, reason: reason.trim() });
      invalidate();
      showToast({ title: "Manutenção registrada", variant: "success" });
      onOpenChange(false);
      reset();
    } catch (error) {
      showToast({ title: "Erro ao registrar manutenção", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar Manutenção</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Data do Envio</Label>
            <Input type="date" value={sentDate} onChange={(e) => setSentDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data da Chegada (opcional)</Label>
            <Input type="date" min={sentDate || undefined} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Motivo do Envio</Label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!sentDate || !reason.trim()} isLoading={isSubmitting} onClick={handleSubmit}>Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
