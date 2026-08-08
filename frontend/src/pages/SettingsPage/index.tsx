import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { PlugZap } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { settingsService } from "@/services/settings.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { SmtpConfig } from "@/types";

const schema = z.object({
  host: z.string().min(1, "Informe o servidor SMTP"),
  port: z.coerce.number().int().positive(),
  secure: z.boolean(),
  user: z.string(),
  password: z.string(),
  fromEmail: z.string().email("E-mail remetente inválido"),
  fromName: z.string().min(1, "Informe o nome do remetente"),
});
type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const { showToast } = useToast();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data: smtp, isLoading } = useQuery({ queryKey: ["settings", "smtp"], queryFn: settingsService.getSmtp });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (smtp) reset({ ...smtp, password: "" });
  }, [smtp, reset]);

  const onSave = async (data: FormData) => {
    try {
      await settingsService.updateSmtp(data as SmtpConfig);
      showToast({ title: "Configurações SMTP salvas", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao salvar configurações", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const values = watch();
      const result = await settingsService.testSmtp(values as SmtpConfig);
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, message: extractErrorMessage(error) });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4 max-w-2xl">
      <Breadcrumb items={[{ label: "Configurações" }]} />
      <Card>
        <CardHeader>
          <CardTitle>Servidor SMTP</CardTitle>
          <CardDescription>Configuração usada para envio de e-mails de notificação do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label>Servidor</Label>
                <Input {...register("host")} placeholder="smtp.gmail.com" />
                {errors.host && <p className="text-xs text-destructive">{errors.host.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Porta</Label>
                <Input type="number" {...register("port")} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={watch("secure")} onCheckedChange={(value) => setValue("secure", value)} />
                <Label>SSL/TLS</Label>
              </div>
              <div className="space-y-1.5">
                <Label>Usuário</Label>
                <Input {...register("user")} />
              </div>
              <div className="space-y-1.5">
                <Label>Senha</Label>
                <PasswordInput {...register("password")} placeholder="••••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail remetente</Label>
                <Input {...register("fromEmail")} />
                {errors.fromEmail && <p className="text-xs text-destructive">{errors.fromEmail.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Nome remetente</Label>
                <Input {...register("fromName")} />
              </div>
            </div>

            {testResult && (
              <p className={`text-sm ${testResult.success ? "text-success" : "text-destructive"}`}>{testResult.message}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" isLoading={isTesting} onClick={handleTest}>
                <PlugZap className="h-4 w-4" /> Testar Conexão
              </Button>
              <Button type="submit" isLoading={isSubmitting}>Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
