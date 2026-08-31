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
import { PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE } from "@/lib/passwordPolicy";

const schema = z.object({
  // Senha atual: só confirma quem está pedindo a troca, não precisa cumprir
  // a política completa (pode ter sido criada antes dela existir) — mesmo
  // mínimo de 6 caracteres exigido pelo backend (auth.dto.ts).
  currentPassword: z.string().min(6, "Informe sua senha atual"),
  newPassword: z.string().regex(PASSWORD_POLICY_REGEX, PASSWORD_POLICY_MESSAGE),
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
            <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_MESSAGE}</p>
            {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
          </div>
          <Button type="submit" isLoading={isSubmitting}>Alterar Senha</Button>
        </form>
      </CardContent>
    </Card>
  );
}
