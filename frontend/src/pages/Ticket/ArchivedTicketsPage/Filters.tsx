import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FiltersProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
}

export function Filters({ startDate, onStartDateChange, endDate, onEndDateChange }: FiltersProps) {
  return (
    <>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">De</Label>
        <Input type="date" className="w-36" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">Até</Label>
        <Input type="date" className="w-36" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
      </div>
    </>
  );
}
