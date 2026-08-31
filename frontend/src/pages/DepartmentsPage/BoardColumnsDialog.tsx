import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { boardsService, BoardColumnInput } from "@/services/boardsService";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { Department } from "@/types";

interface ColumnDraft {
  id?: string;
  name: string;
  color: string;
  isInitial: boolean;
  isDone: boolean;
  isCancelled: boolean;
}

function emptyDraft(): ColumnDraft {
  return { name: "", color: "#94a3b8", isInitial: false, isDone: false, isCancelled: false };
}

interface BoardColumnsDialogProps {
  department: Department | null;
  onOpenChange: (open: boolean) => void;
}

export function BoardColumnsDialog({ department, onOpenChange }: BoardColumnsDialogProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<ColumnDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: board, isLoading } = useQuery({
    queryKey: ["boards", "department", department?.id],
    queryFn: () => boardsService.getForDepartment(department!.id),
    enabled: !!department,
  });

  useEffect(() => {
    if (board) {
      const sorted = [...board.columns].sort((a, b) => a.order - b.order);
      setDrafts(sorted.map((c) => ({
        id: c.id, name: c.name, color: c.color,
        isInitial: c.isInitial, isDone: c.isDone, isCancelled: c.isCancelled,
      })));
    }
  }, [board]);

  const update = (index: number, patch: Partial<ColumnDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  // Só uma coluna pode ser "inicial" — marcar uma desmarca as demais (rádio).
  const setInitial = (index: number) => {
    setDrafts((prev) => prev.map((d, i) => ({ ...d, isInitial: i === index })));
  };

  const move = (index: number, direction: -1 | 1) => {
    setDrafts((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (index: number) => setDrafts((prev) => prev.filter((_, i) => i !== index));
  const add = () => setDrafts((prev) => [...prev, emptyDraft()]);

  const handleSave = async () => {
    if (!board) return;
    if (drafts.length === 0) {
      showToast({ title: "O board precisa de ao menos uma coluna", variant: "destructive" });
      return;
    }
    if (drafts.some((d) => !d.name.trim())) {
      showToast({ title: "Toda coluna precisa de um nome", variant: "destructive" });
      return;
    }
    if (drafts.filter((d) => d.isInitial).length !== 1) {
      showToast({ title: "Marque exatamente uma coluna como inicial", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload: BoardColumnInput[] = drafts.map((d) => ({
        id: d.id,
        name: d.name.trim(),
        color: d.color,
        isInitial: d.isInitial,
        isDone: d.isDone,
        isCancelled: d.isCancelled,
      }));
      await boardsService.replaceColumns(board.id, payload);
      showToast({ title: "Colunas do board salvas", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      onOpenChange(false);
    } catch (error) {
      showToast({ title: "Erro ao salvar colunas", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!department} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Colunas do board — {department?.name}</DialogTitle>
          <DialogDescription>
            Defina as etapas do fluxo de trabalho deste departamento. A coluna inicial é onde todo ticket novo nasce;
            colunas marcadas como Resolvido/Cancelado liberam o arquivamento do ticket.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        {!isLoading && (
          <div className="space-y-3">
            {drafts.map((draft, index) => (
              <div key={draft.id ?? `new-${index}`} className="rounded-md border border-border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <Label className="text-xs">Nome</Label>
                      <Input value={draft.name} onChange={(e) => update(index, { name: e.target.value })} placeholder="Ex.: Em análise" />
                    </div>
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <Label className="text-xs">Cor</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          className="h-9 w-10 shrink-0 cursor-pointer rounded border border-input bg-transparent p-1"
                          value={draft.color}
                          onChange={(e) => update(index, { color: e.target.value })}
                        />
                        <Input value={draft.color} onChange={(e) => update(index, { color: e.target.value })} className="font-mono text-xs" />
                      </div>
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="radio"
                          name="initial-column"
                          checked={draft.isInitial}
                          onChange={() => setInitial(index)}
                          className="h-3.5 w-3.5"
                        />
                        Coluna inicial
                      </label>
                      <div className="flex items-center gap-2">
                        <Switch checked={draft.isDone} onCheckedChange={(checked) => update(index, { isDone: checked })} />
                        <Label className="font-normal text-xs">Resolvido</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={draft.isCancelled} onCheckedChange={(checked) => update(index, { isCancelled: checked })} />
                        <Label className="font-normal text-xs">Cancelado</Label>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === drafts.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(index)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={add}><Plus className="h-4 w-4" /> Adicionar coluna</Button>
          </div>
        )}

        <DialogFooter>
          <Button type="button" onClick={handleSave} isLoading={isSaving} disabled={isLoading}>Salvar Colunas</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
