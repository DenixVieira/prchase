import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Organization, RequestType } from "@/types";

interface FiltersBarProps {
  view: "board" | "table";
  onViewChange: (view: "board" | "table") => void;
  search: string;
  onSearchChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  organizationId: string;
  onOrganizationIdChange: (value: string) => void;
  organizations?: Organization[];
  requestTypeId: string;
  onRequestTypeIdChange: (value: string) => void;
  requestTypes?: RequestType[];
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  assigneeFilter: "all" | "unassigned" | "me";
  onAssigneeFilterChange: (value: "all" | "unassigned" | "me") => void;
  onExport: () => void;
}

export function FiltersBar({
  view, onViewChange,
  search, onSearchChange,
  priority, onPriorityChange,
  organizationId, onOrganizationIdChange, organizations,
  requestTypeId, onRequestTypeIdChange, requestTypes,
  startDate, onStartDateChange,
  endDate, onEndDateChange,
  assigneeFilter, onAssigneeFilterChange,
  onExport,
}: FiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {view === "board" && (
        <Input placeholder="Pesquisar protocolo ou título..." className="w-64" value={search} onChange={(e) => onSearchChange(e.target.value)} />
      )}
      <Select value={priority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="LOW">Baixa</SelectItem>
          <SelectItem value="MEDIUM">Média</SelectItem>
          <SelectItem value="HIGH">Alta</SelectItem>
          <SelectItem value="URGENT">Urgente</SelectItem>
        </SelectContent>
      </Select>
      {(requestTypes ?? []).length > 1 && (
        <Select value={requestTypeId} onValueChange={onRequestTypeIdChange}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tipo de solicitação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(requestTypes ?? []).map((requestType) => (
              <SelectItem key={requestType.id} value={requestType.id}>{requestType.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {(organizations ?? []).length > 1 && (
        <Select value={organizationId} onValueChange={onOrganizationIdChange}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Organização" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as organizações</SelectItem>
            {(organizations ?? []).map((organization) => (
              <SelectItem key={organization.id} value={organization.id}>{organization.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">De</Label>
        <Input type="date" className="w-36" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} />
      </div>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground">Até</Label>
        <Input type="date" className="w-36" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
      </div>
      <Select value={assigneeFilter} onValueChange={(value) => onAssigneeFilterChange(value as "all" | "unassigned" | "me")}>
        <SelectTrigger className="w-40"><SelectValue placeholder="Responsável" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os responsáveis</SelectItem>
          <SelectItem value="unassigned">Sem responsável</SelectItem>
          <SelectItem value="me">Atribuído a mim</SelectItem>
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={onExport}><Download className="h-4 w-4" /> CSV</Button>
      <Tabs value={view} onValueChange={(value) => onViewChange(value as "board" | "table")}>
        <TabsList>
          <TabsTrigger value="board">Kanban</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
