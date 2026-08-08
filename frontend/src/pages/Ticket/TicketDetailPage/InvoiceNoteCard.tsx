import { useRef, useState } from "react";
import { Paperclip, Lock, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ticketsService } from "@/services/tickets.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Attachment, PermissionKey, Ticket } from "@/types";
import { useInvalidateTicket } from "./useInvalidateTicket";

interface InvoiceNoteCardProps {
  ticket: Ticket;
  onPreview: (attachment: Attachment) => void;
}

export function InvoiceNoteCard({ ticket, onPreview }: InvoiceNoteCardProps) {
  const { showToast } = useToast();
  const invalidate = useInvalidateTicket();
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const [pendingInvoiceFile, setPendingInvoiceFile] = useState<File | null>(null);
  const [invoiceDueDate, setInvoiceDueDate] = useState("");

  const handleInvoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reseta o input já aqui, não só depois de confirmar: garante que
    // escolher o mesmo arquivo de novo (ex.: após cancelar) volte a disparar onChange.
    event.target.value = "";
    if (file) setPendingInvoiceFile(file);
  };

  const handleConfirmInvoiceUpload = async () => {
    if (!pendingInvoiceFile || !invoiceDueDate) return;
    try {
      await ticketsService.uploadInvoiceAttachment(ticket.id, pendingInvoiceFile, invoiceDueDate);
      invalidate();
      showToast({ title: "Nota fiscal anexada", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao anexar nota fiscal", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setPendingInvoiceFile(null);
      setInvoiceDueDate("");
    }
  };

  const invoiceAttachment = (ticket.attachments ?? []).find((a) => a.isInvoiceNote);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Nota Fiscal</CardTitle></CardHeader>
      <CardContent>
        {invoiceAttachment ? (
          <button
            type="button"
            onClick={() => onPreview(invoiceAttachment)}
            className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-accent text-left"
          >
            <span className="flex items-center gap-2 truncate">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" /> {invoiceAttachment.originalName}
            </span>
            <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ) : ticket.isArchived ? (
          <p className="text-sm text-muted-foreground">Nenhuma nota fiscal anexada.</p>
        ) : (
          <PermissionGate
            permissions={[PermissionKey.ATTACH_FILES]}
            fallback={<p className="text-sm text-muted-foreground">Nenhuma nota fiscal anexada.</p>}
          >
            <div>
              <input ref={invoiceInputRef} type="file" className="hidden" onChange={handleInvoiceFileChange} />
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => invoiceInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
                Anexar nota
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">Após anexada, a nota fiscal não poderá ser alterada.</p>
              <ConfirmDialog
                open={!!pendingInvoiceFile}
                onOpenChange={(open) => { if (!open) { setPendingInvoiceFile(null); setInvoiceDueDate(""); } }}
                title="Anexar nota fiscal"
                description={`Tem certeza que deseja anexar a nota "${pendingInvoiceFile?.name ?? ""}"? Esse arquivo não poderá ser alterado.`}
                confirmLabel="Anexar"
                confirmDisabled={!invoiceDueDate}
                onConfirm={handleConfirmInvoiceUpload}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">Data de vencimento</Label>
                  <Input type="date" value={invoiceDueDate} onChange={(e) => setInvoiceDueDate(e.target.value)} />
                </div>
              </ConfirmDialog>
            </div>
          </PermissionGate>
        )}
      </CardContent>
    </Card>
  );
}
