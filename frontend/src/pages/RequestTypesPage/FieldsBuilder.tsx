import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { requestTypesService, RequestFieldInput } from "@/services/requestTypes.service";
import { RequestType, RequestFieldType, RequestFieldOption } from "@/types";

const TYPE_LABELS: Record<RequestFieldType, string> = {
  [RequestFieldType.TEXT]: "Texto",
  [RequestFieldType.TEXTAREA]: "Texto longo",
  [RequestFieldType.NUMBER]: "Número",
  [RequestFieldType.DATE]: "Data",
  [RequestFieldType.DATETIME]: "Data e Hora",
  [RequestFieldType.SELECT]: "Seleção",
  [RequestFieldType.MULTISELECT]: "Múltipla seleção",
  [RequestFieldType.CHECKBOX]: "Checkbox",
  [RequestFieldType.FILE]: "Upload de arquivo",
};

const HAS_OPTIONS = new Set([RequestFieldType.SELECT, RequestFieldType.MULTISELECT]);

interface FieldDraft {
  label: string;
  key?: string;
  type: RequestFieldType;
  required: boolean;
  options: RequestFieldOption[];
  helpText: string;
}

function emptyDraft(): FieldDraft {
  return { label: "", type: RequestFieldType.TEXT, required: false, options: [], helpText: "" };
}

interface FieldsBuilderProps {
  requestType: RequestType | null;
  onOpenChange: (open: boolean) => void;
}

export function FieldsBuilder({ requestType, onOpenChange }: FieldsBuilderProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [drafts, setDrafts] = useState<FieldDraft[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (requestType) {
      const sorted = [...(requestType.fields ?? [])].sort((a, b) => a.order - b.order);
      setDrafts(sorted.map((f) => ({
        label: f.label, key: f.key, type: f.type, required: f.required,
        options: f.options ?? [], helpText: f.helpText ?? "",
      })));
    }
  }, [requestType]);

  const update = (index: number, patch: Partial<FieldDraft>) => {
    setDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
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
    if (!requestType) return;
    if (drafts.some((d) => !d.label.trim())) {
      showToast({ title: "Todo campo precisa de um rótulo", variant: "destructive" });
      return;
    }
    if (drafts.some((d) => HAS_OPTIONS.has(d.type) && d.options.length === 0)) {
      showToast({ title: "Campos de seleção precisam de ao menos uma opção", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload: RequestFieldInput[] = drafts.map((d, index) => ({
        label: d.label.trim(),
        key: d.key,
        type: d.type,
        required: d.required,
        options: HAS_OPTIONS.has(d.type) ? d.options : undefined,
        helpText: d.helpText.trim() || undefined,
        order: index,
      }));
      await requestTypesService.replaceFields(requestType.id, payload);
      showToast({ title: "Campos salvos", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["request-types"] });
      onOpenChange(false);
    } catch (error) {
      showToast({ title: "Erro ao salvar campos", description: extractErrorMessage(error), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={!!requestType} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campos de "{requestType?.name}"</DialogTitle>
          <DialogDescription>Defina os campos do formulário exibido ao criar essa solicitação.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {drafts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum campo ainda — adicione o primeiro abaixo.</p>}
          {drafts.map((draft, index) => (
            <div key={index} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <Label className="text-xs">Rótulo</Label>
                    <Input value={draft.label} onChange={(e) => update(index, { label: e.target.value })} placeholder="Ex.: Equipamento" />
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={draft.type} onValueChange={(value) => update(index, { type: value as RequestFieldType })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(RequestFieldType).map((type) => (
                          <SelectItem key={type} value={type}>{TYPE_LABELS[type]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">Texto de ajuda (opcional)</Label>
                    <Input value={draft.helpText} onChange={(e) => update(index, { helpText: e.target.value })} placeholder={draft.type === RequestFieldType.CHECKBOX ? "Texto exibido ao lado do checkbox" : "Dica exibida abaixo do campo"} />
                  </div>
                  {HAS_OPTIONS.has(draft.type) && (
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Opções</Label>
                      {draft.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-1.5">
                          <Input
                            className="h-8"
                            value={option.label}
                            placeholder="Rótulo exibido"
                            onChange={(e) => {
                              const label = e.target.value;
                              update(index, {
                                options: draft.options.map((o, i) => (i === optionIndex ? { label, value: o.value || label } : o)),
                              });
                            }}
                          />
                          <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => update(index, { options: draft.options.filter((_, i) => i !== optionIndex) })}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => update(index, { options: [...draft.options, { label: "", value: "" }] })}>
                        <Plus className="h-3.5 w-3.5" /> Adicionar opção
                      </Button>
                    </div>
                  )}
                  <div className="col-span-2 flex items-center gap-2 pt-1">
                    <Switch checked={draft.required} onCheckedChange={(checked) => update(index, { required: checked })} />
                    <Label className="font-normal text-xs">Obrigatório</Label>
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
          <Button type="button" variant="outline" onClick={add}><Plus className="h-4 w-4" /> Adicionar campo</Button>
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleSave} isLoading={isSaving}>Salvar Campos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
