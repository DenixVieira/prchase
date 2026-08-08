import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Department, Organization } from "@/types";

interface FiltersProps {
  organizationId: string;
  onOrganizationIdChange: (value: string) => void;
  organizations?: Organization[];
  departmentId: string;
  onDepartmentIdChange: (value: string) => void;
  departments?: Department[];
}

export function Filters({ organizationId, onOrganizationIdChange, organizations, departmentId, onDepartmentIdChange, departments }: FiltersProps) {
  return (
    <>
      <Select value={organizationId} onValueChange={onOrganizationIdChange}>
        <SelectTrigger className="w-44"><SelectValue placeholder="Organização" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as organizações</SelectItem>
          {(organizations ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={departmentId} onValueChange={onDepartmentIdChange} disabled={organizationId === "all"}>
        <SelectTrigger className="w-48"><SelectValue placeholder={organizationId === "all" ? "Selecione a organização primeiro" : "Departamento"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os departamentos</SelectItem>
          {(departments ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </>
  );
}
