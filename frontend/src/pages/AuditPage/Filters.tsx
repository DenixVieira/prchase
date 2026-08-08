import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ACTIONS } from "./constants";

interface FiltersProps {
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  action: string;
  onActionChange: (value: string) => void;
}

export function Filters({ dateFrom, onDateFromChange, dateTo, onDateToChange, action, onActionChange }: FiltersProps) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">De</Label>
        <Input type="date" className="w-36" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
      </div>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">Até</Label>
        <Input type="date" className="w-36" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
      </div>
      <Select value={action} onValueChange={onActionChange}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Ação" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as ações</SelectItem>
          {ACTIONS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
        </SelectContent>
      </Select>
    </>
  );
}
