import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";

const emailSchema = z.object({
  currentPassword: z.string().min(6, "Informe sua senha atual"),
  newEmail: z.string().email("Informe um e-mail válido"),
});
type EmailFormData = z.infer<typeof emailSchema>;

export function ChangeEmailCard() {
  const { user, refreshUser } = useAuth();
  const { showToast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });

  const onSubmit = async (data: EmailFormData) => {
    try {
      await authService.changeEmail(data.currentPassword, data.newEmail);
      await refreshUser();
      showToast({ title: "E-mail alterado com sucesso", variant: "success" });
      reset();
    } catch (error) {
      showToast({ title: "Erro ao alterar e-mail", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Alterar E-mail</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Novo E-mail</Label>
            <Input type="email" placeholder={user?.email} {...register("newEmail")} />
            {errors.newEmail && <p className="text-xs text-destructive">{errors.newEmail.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Senha Atual</Label>
            <PasswordInput {...register("currentPassword")} />
            {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
          </div>
          <Button type="submit" isLoading={isSubmitting}>Alterar E-mail</Button>
        </form>
      </CardContent>
    </Card>
  );
}
