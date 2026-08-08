import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Ban, CheckCircle2, XCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { purchaseRequestsService } from "@/services/purchaseRequests.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionKey, PurchaseRequest, PurchaseRequestStatus } from "@/types";

export function ActionsBar({ purchaseRequest }: { purchaseRequest: PurchaseRequest }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["purchase-requests"] });

  const handleSubmit = async () => {
    try {
      await purchaseRequestsService.submit(purchaseRequest.id);
      showToast({ title: "Solicitação enviada para aprovação", variant: "success" });
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao enviar", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    try {
      await purchaseRequestsService.cancel(purchaseRequest.id);
      showToast({ title: "Solicitação cancelada", variant: "success" });
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao cancelar", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleApprove = async () => {
    try {
      const result = await purchaseRequestsService.approve(purchaseRequest.id);
      showToast({ title: "Solicitação aprovada", description: `Ticket ${result.ticket.protocol} criado no Kanban.`, variant: "success" });
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao aprovar", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleReject = async () => {
    try {
      await purchaseRequestsService.reject(purchaseRequest.id, rejectReason);
      showToast({ title: "Solicitação reprovada", variant: "success" });
      setRejectOpen(false);
      setRejectReason("");
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao reprovar", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const isOwner = purchaseRequest.requesterId === user?.id;
  // Admin pode aprovar mesmo sendo do mesmo departamento do solicitante —
  // mesma exceção já aplicada no backend (purchase-requests.service.ts).
  const canApproveDepartment = user?.isAdmin || user?.department?.id !== purchaseRequest.departmentId;

  return (
    <div className="flex flex-wrap gap-2">
      {purchaseRequest.status === PurchaseRequestStatus.DRAFT && isOwner && (
        <PermissionGate permissions={[PermissionKey.EDIT_PURCHASE_REQUEST]}>
          <Button size="sm" variant="outline" onClick={() => navigate(`/purchase-requests/${purchaseRequest.id}/edit`)}>
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </PermissionGate>
      )}
      {purchaseRequest.status === PurchaseRequestStatus.DRAFT && isOwner && (
        <Button size="sm" onClick={handleSubmit}><Send className="h-4 w-4" /> Enviar para Aprovação</Button>
      )}
      {[PurchaseRequestStatus.DRAFT, PurchaseRequestStatus.PENDING_APPROVAL].includes(purchaseRequest.status) && isOwner && (
        <PermissionGate permissions={[PermissionKey.CANCEL_PURCHASE_REQUEST]}>
          <ConfirmDialog
            trigger={<Button size="sm" variant="outline"><Ban className="h-4 w-4" /> Cancelar</Button>}
            title="Cancelar solicitação"
            description="Tem certeza que deseja cancelar esta solicitação de compra? Esta ação não pode ser desfeita."
            confirmLabel="Cancelar Solicitação"
            variant="destructive"
            onConfirm={handleCancel}
          />
        </PermissionGate>
      )}
      {purchaseRequest.status === PurchaseRequestStatus.PENDING_APPROVAL && (
        <PermissionGate permissions={[PermissionKey.APPROVE_PURCHASE_REQUEST]}>
          {canApproveDepartment ? (
            <>
              <ConfirmDialog
                trigger={<Button size="sm" className="bg-success hover:bg-success/90"><CheckCircle2 className="h-4 w-4" /> Aprovar</Button>}
                title="Aprovar solicitação"
                description="Ao aprovar, um Ticket será criado automaticamente no Kanban."
                confirmLabel="Aprovar"
                onConfirm={handleApprove}
              />
              <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="destructive"><XCircle className="h-4 w-4" /> Reprovar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Reprovar solicitação</DialogTitle></DialogHeader>
                  <Textarea placeholder="Motivo da reprovação" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" disabled={rejectReason.trim().length < 5} onClick={handleReject}>Confirmar Reprovação</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <p className="text-xs text-muted-foreground self-center">Aprovação deve ser feita por outro departamento.</p>
          )}
        </PermissionGate>
      )}
    </div>
  );
}
