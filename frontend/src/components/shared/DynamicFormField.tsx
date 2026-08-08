import { useRef } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { Paperclip, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RequestField, RequestFieldType } from "@/types";

interface DynamicFormFieldProps {
  field: RequestField;
  control: Control<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
}

export function DynamicFormField({ field, control, errors }: DynamicFormFieldProps) {
  const error = errors[field.key]?.message as string | undefined;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-destructive"> *</span>}
      </Label>
      <Controller
        control={control}
        name={field.key}
        render={({ field: rhf }) => <FieldControl field={field} rhf={rhf} />}
      />
      {field.helpText && !error && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FieldControl({
  field,
  rhf,
}: {
  field: RequestField;
  rhf: { value: unknown; onChange: (value: unknown) => void };
}) {
  switch (field.type) {
    case RequestFieldType.TEXT:
      return <Input id={field.key} value={(rhf.value as string) ?? ""} onChange={(e) => rhf.onChange(e.target.value)} />;

    case RequestFieldType.TEXTAREA:
      return <Textarea id={field.key} rows={3} value={(rhf.value as string) ?? ""} onChange={(e) => rhf.onChange(e.target.value)} />;

    case RequestFieldType.NUMBER:
      return <Input id={field.key} type="number" value={(rhf.value as string | number) ?? ""} onChange={(e) => rhf.onChange(e.target.value)} />;

    case RequestFieldType.DATE:
      return <Input id={field.key} type="date" value={(rhf.value as string) ?? ""} onChange={(e) => rhf.onChange(e.target.value)} />;

    case RequestFieldType.CHECKBOX:
      return (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox id={field.key} checked={!!rhf.value} onCheckedChange={(checked) => rhf.onChange(checked === true)} />
          <Label htmlFor={field.key} className="font-normal">{field.helpText ?? "Sim"}</Label>
        </div>
      );

    case RequestFieldType.SELECT:
      return (
        <Select value={(rhf.value as string) ?? ""} onValueChange={rhf.onChange}>
          <SelectTrigger id={field.key}><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case RequestFieldType.MULTISELECT: {
      const selected = new Set(Array.isArray(rhf.value) ? (rhf.value as string[]) : []);
      const toggle = (value: string, checked: boolean) => {
        const next = new Set(selected);
        if (checked) next.add(value); else next.delete(value);
        rhf.onChange(Array.from(next));
      };
      return (
        <div className="space-y-2 rounded-md border border-input p-3">
          {(field.options ?? []).map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <Checkbox
                id={`${field.key}-${option.value}`}
                checked={selected.has(option.value)}
                onCheckedChange={(checked) => toggle(option.value, checked === true)}
              />
              <Label htmlFor={`${field.key}-${option.value}`} className="font-normal">{option.label}</Label>
            </div>
          ))}
        </div>
      );
    }

    case RequestFieldType.FILE:
      return <FileFieldControl value={rhf.value as File | undefined} onChange={rhf.onChange} />;

    default:
      return null;
  }
}

function FileFieldControl({ value, onChange }: { value: File | undefined; onChange: (file: File | undefined) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0])}
      />
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Paperclip className="h-4 w-4" /> {value ? "Trocar arquivo" : "Anexar arquivo"}
      </Button>
      {value && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[220px]">
          {value.name}
          <button
            type="button"
            onClick={() => { onChange(undefined); if (inputRef.current) inputRef.current.value = ""; }}
            aria-label="Remover arquivo"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      )}
    </div>
  );
}
