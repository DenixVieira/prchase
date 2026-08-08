import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Department, Organization, PurchaseRequestStatus } from "@/types";

interface FiltersProps {
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  departmentId: string;
  onDepartmentIdChange: (value: string) => void;
  departments?: Department[];
  organizationId: string;
  onOrganizationIdChange: (value: string) => void;
  organizations?: Organization[];
}

export function Filters({
  startDate, onStartDateChange,
  endDate, onEndDateChange,
  status, onStatusChange,
  departmentId, onDepartmentIdChange, departments,
  organizationId, onOrganizationIdChange, organizations,
}: FiltersProps) {
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
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {Object.values(PurchaseRequestStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={departmentId} onValueChange={onDepartmentIdChange} disabled={organizationId === "all"}>
        <SelectTrigger className="w-48"><SelectValue placeholder={organizationId === "all" ? "Selecione a organização primeiro" : "Departamento"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os departamentos</SelectItem>
          {(departments ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
      {(organizations ?? []).length > 1 && (
        <Select value={organizationId} onValueChange={onOrganizationIdChange}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Organização" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as organizações</SelectItem>
            {(organizations ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
    </>
  );
}
