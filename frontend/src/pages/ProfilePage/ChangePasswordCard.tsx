import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";

const schema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6, "A nova senha deve ter ao menos 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

export function ChangePasswordCard() {
  const { showToast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      showToast({ title: "Senha alterada com sucesso", variant: "success" });
      reset();
    } catch (error) {
      showToast({ title: "Erro ao alterar senha", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Alterar Senha</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Senha Atual</Label>
            <PasswordInput {...register("currentPassword")} />
            {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Nova Senha</Label>
            <PasswordInput {...register("newPassword")} />
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>
          <Button type="submit" isLoading={isSubmitting}>Alterar Senha</Button>
        </form>
      </CardContent>
    </Card>
  );
}
