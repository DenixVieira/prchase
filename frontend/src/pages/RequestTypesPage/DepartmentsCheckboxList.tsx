import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Department } from "@/types";

interface DepartmentsCheckboxListProps {
  departments?: Department[];
  value: string[];
  onChange: (departmentIds: string[]) => void;
}

/**
 * Restrição extra e OPCIONAL, por cima da organização (ver
 * OrganizationsCheckboxList) — ao contrário dela, aqui vazio não esconde
 * nada: só restringe quando o admin marca departamentos específicos.
 */
export function DepartmentsCheckboxList({ departments, value, onChange }: DepartmentsCheckboxListProps) {
  const toggle = (departmentId: string, checked: boolean) => {
    onChange(checked ? Array.from(new Set([...value, departmentId])) : value.filter((id) => id !== departmentId));
  };

  return (
    <div className="space-y-1.5">
      <Label>Restringir a departamentos específicos (opcional)</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border border-border p-2">
        {(departments ?? []).map((department) => (
          <label key={department.id} className="flex items-center gap-2 rounded-md p-1.5 text-sm cursor-pointer hover:bg-accent">
            <Checkbox checked={value.includes(department.id)} onCheckedChange={(checked) => toggle(department.id, checked === true)} />
            {department.name}
          </label>
        ))}
        {(departments ?? []).length === 0 && <p className="text-xs text-muted-foreground p-1.5">Nenhum departamento cadastrado.</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length === 0
          ? "Nenhum marcado — vale só a regra de organização acima, qualquer departamento com acesso a ela vê este tipo."
          : "Só os departamentos marcados aqui veem este tipo, mesmo que outros também acessem as organizações marcadas acima."}
      </p>
    </div>
  );
}
