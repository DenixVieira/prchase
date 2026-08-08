import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Organization } from "@/types";

interface FiltersCardProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  organizationId: string;
  onOrganizationIdChange: (value: string) => void;
  organizations?: Organization[];
  hasActiveFilters: boolean;
  onClear: () => void;
}

export function FiltersCard({
  startDate, onStartDateChange,
  endDate, onEndDateChange,
  organizationId, onOrganizationIdChange, organizations,
  hasActiveFilters, onClear,
}: FiltersCardProps) {
  return (
    <Card>
      <CardContent className="pt-6 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">De</Label>
          <Input type="date" className="w-40" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Até</Label>
          <Input type="date" className="w-40" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
        </div>
        {(organizations ?? []).length > 1 && (
          <div className="space-y-1.5">
            <Label className="text-xs">Organização</Label>
            <Select value={organizationId} onValueChange={onOrganizationIdChange}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Organização" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as organizações</SelectItem>
                {(organizations ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClear}>
            <X className="h-4 w-4" /> Limpar filtros
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
