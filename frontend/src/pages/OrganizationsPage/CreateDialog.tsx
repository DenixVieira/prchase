import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { organizationsService } from "@/services/organizations.service";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface CreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDialog({ open, onOpenChange }: CreateDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  const onCreate = async (formData: FormData) => {
    try {
      await organizationsService.create(formData);
      showToast({ title: "Organização criada", variant: "success" });
      onOpenChange(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    } catch (error) {
      showToast({ title: "Erro ao criar organização", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Organização</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onCreate)} className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
          <DialogFooter><Button type="submit" isLoading={form.formState.isSubmitting}>Criar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
