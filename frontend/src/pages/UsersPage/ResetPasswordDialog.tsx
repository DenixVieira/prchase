import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { usersService } from "@/services/users.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { User } from "@/types";

interface ResetPasswordDialogProps {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}

export function ResetPasswordDialog({ user, onOpenChange }: ResetPasswordDialogProps) {
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState("");

  const handleResetPassword = async () => {
    if (!user) return;
    try {
      await usersService.resetPassword(user.id, newPassword);
      showToast({ title: "Senha redefinida", variant: "success" });
      onOpenChange(false);
      setNewPassword("");
    } catch (error) {
      showToast({ title: "Erro ao redefinir senha", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Redefinir senha de {user?.name}</DialogTitle></DialogHeader>
        <PasswordInput placeholder="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <DialogFooter>
          <Button disabled={newPassword.length < 6} onClick={handleResetPassword}>Redefinir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
