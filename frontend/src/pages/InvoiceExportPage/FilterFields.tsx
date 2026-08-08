import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addDaysToDateString } from "@/lib/utils";
import { Organization } from "@/types";
import { MAX_RANGE_DAYS } from "./constants";

interface FilterFieldsProps {
  organizationId: string;
  onOrganizationIdChange: (value: string) => void;
  organizations?: Organization[];
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
}

export function FilterFields({
  organizationId, onOrganizationIdChange, organizations,
  startDate, onStartDateChange,
  endDate, onEndDateChange,
}: FilterFieldsProps) {
  // Intervalo máximo de 30 dias: evita que uma exportação com período muito
  // amplo (ex.: "o ano inteiro") force a compactação de um volume de arquivos
  // sem limite dentro de uma única requisição. O backend valida o mesmo limite
  // — e a aba de consulta reaproveita a mesma janela, pra não ter duas regras
  // de período diferentes na mesma tela.
  const maxEndDate = startDate ? addDaysToDateString(startDate, MAX_RANGE_DAYS) : undefined;

  const handleStartDateChange = (value: string) => {
    onStartDateChange(value);
    if (value && endDate && (endDate < value || endDate > addDaysToDateString(value, MAX_RANGE_DAYS))) {
      onEndDateChange("");
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label>Organização</Label>
        <Select value={organizationId} onValueChange={onOrganizationIdChange}>
          <SelectTrigger><SelectValue placeholder="Selecione a organização" /></SelectTrigger>
          <SelectContent>
            {(organizations ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Data inicial</Label>
        <Input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Data final</Label>
        <Input
          type="date"
          value={endDate}
          min={startDate || undefined}
          max={maxEndDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
      </div>
    </div>
  );
}
