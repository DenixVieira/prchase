import { useEffect } from "react";
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
import { Organization } from "@/types";

const schema = z.object({
  name: z.string().min(2, "Informe o nome"),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface EditDialogProps {
  organization: Organization | null;
  onOpenChange: (open: boolean) => void;
}

export function EditDialog({ organization, onOpenChange }: EditDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (organization) form.reset({ name: organization.name, description: organization.description ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  const onEdit = async (formData: FormData) => {
    if (!organization) return;
    try {
      await organizationsService.update(organization.id, formData);
      showToast({ title: "Organização atualizada", variant: "success" });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    } catch (error) {
      showToast({ title: "Erro ao atualizar organização", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  return (
    <Dialog open={!!organization} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Organização</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onEdit)} className="space-y-3">
          <div className="space-y-1">
            <Label>Nome</Label>
            <Input {...form.register("name")} />
            {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-1"><Label>Descrição</Label><Textarea {...form.register("description")} /></div>
          <DialogFooter><Button type="submit" isLoading={form.formState.isSubmitting}>Salvar</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
