import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usersService } from "@/services/users.service";
import { departmentsService } from "@/services/departments.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  login: z.string().min(3, "Informe o login"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
  departmentId: z.string().uuid().optional(),
  isAdmin: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data: departments } = useQuery({ queryKey: ["departments", "all"], queryFn: () => departmentsService.list({ limit: 100 }) });
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onCreate = async (formData: FormData) => {
    try {
      await usersService.create(formData);
      showToast({ title: "Usuário criado", variant: "success" });
      onOpenChange(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (error) {
      showToast({ title: "Erro ao criar usuário", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onCreate)} className="space-y-3">
          <div className="space-y-1"><Label>Nome</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
          <div className="space-y-1"><Label>Login</Label><Input {...register("login")} />{errors.login && <p className="text-xs text-destructive">{errors.login.message}</p>}</div>
          <div className="space-y-1"><Label>E-mail</Label><Input {...register("email")} />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
          <div className="space-y-1"><Label>Senha</Label><PasswordInput {...register("password")} />{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div>
          <div className="space-y-1">
            <Label>Departamento</Label>
            <Controller control={control} name="departmentId" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>{(departments?.items ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            )} />
          </div>
          <div className="flex items-center gap-2">
            <Controller control={control} name="isAdmin" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
            <Label>Administrador do sistema</Label>
          </div>
          <DialogFooter>
            <Button type="submit" isLoading={isSubmitting}>Criar Usuário</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
