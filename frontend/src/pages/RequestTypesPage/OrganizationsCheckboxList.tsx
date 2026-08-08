import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Organization } from "@/types";

interface OrganizationsCheckboxListProps {
  organizations?: Organization[];
  value: string[];
  onChange: (organizationIds: string[]) => void;
}

/**
 * Sem nenhuma marcada, o tipo fica oculto pra todo mundo (ver
 * RequestType.organizations no backend) — por isso o aviso mesmo quando a
 * lista está vazia, pra não parecer um bug silencioso depois.
 */
export function OrganizationsCheckboxList({ organizations, value, onChange }: OrganizationsCheckboxListProps) {
  const toggle = (organizationId: string, checked: boolean) => {
    onChange(checked ? Array.from(new Set([...value, organizationId])) : value.filter((id) => id !== organizationId));
  };

  return (
    <div className="space-y-1.5">
      <Label>Organizações em que este tipo aparece</Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto rounded-md border border-border p-2">
        {(organizations ?? []).map((organization) => (
          <label key={organization.id} className="flex items-center gap-2 rounded-md p-1.5 text-sm cursor-pointer hover:bg-accent">
            <Checkbox checked={value.includes(organization.id)} onCheckedChange={(checked) => toggle(organization.id, checked === true)} />
            {organization.name}
          </label>
        ))}
        {(organizations ?? []).length === 0 && <p className="text-xs text-muted-foreground p-1.5">Nenhuma organização cadastrada.</p>}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length === 0
          ? "Nenhuma marcada — este tipo fica oculto em \"Nova Solicitação\" até você marcar ao menos uma."
          : "Só departamentos com acesso a alguma das organizações marcadas veem este tipo."}
      </p>
    </div>
  );
}
