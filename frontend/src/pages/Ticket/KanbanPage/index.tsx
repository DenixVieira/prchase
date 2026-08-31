import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ticketsService } from "@/services/tickets.service";
import { organizationsService } from "@/services/organizations.service";
import { requestTypesService } from "@/services/requestTypes.service";
import { boardsService } from "@/services/boardsService";
import { departmentsService } from "@/services/departments.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/contexts/AuthContext";
import { extractErrorMessage } from "@/services/api";
import { downloadCsvBlob } from "@/lib/utils";
import { PermissionKey, RequestTypeSourceKind, Ticket } from "@/types";
import { FiltersBar } from "./FiltersBar";
import { BoardView } from "./BoardView";
import { TableView } from "./TableView";

export default function KanbanPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { can } = usePermission();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [organizationId, setOrganizationId] = useState("all");
  const [requestTypeId, setRequestTypeId] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<"all" | "unassigned" | "me">("all");
  const [view, setView] = useState<"board" | "table">("board");
  const [columnLimit, setColumnLimit] = useState(50);
  const [tablePage, setTablePage] = useState(1);
  const [tableSortBy, setTableSortBy] = useState("createdAt");
  const [tableSortOrder, setTableSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const debouncedSearch = useDebounce(search);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Quem tem acesso irrestrito (admin/SYSTEM_ADMIN) ganha um seletor pra
  // trocar de board — o Kanban sempre mostra o de UM departamento por vez
  // (as colunas são configuráveis por departamento, não dá pra misturar).
  const isPrivileged = can(PermissionKey.SYSTEM_ADMIN);
  const [boardDepartmentId, setBoardDepartmentId] = useState(user?.department?.id ?? "");
  useEffect(() => {
    if (!boardDepartmentId && user?.department?.id) setBoardDepartmentId(user.department.id);
  }, [boardDepartmentId, user?.department?.id]);

  const { data: allDepartments } = useQuery({
    queryKey: ["departments", "active"],
    queryFn: () => departmentsService.listActive(),
    enabled: isPrivileged,
  });

  const { data: board } = useQuery({
    queryKey: ["boards", "department", boardDepartmentId],
    queryFn: () => boardsService.getForDepartment(boardDepartmentId),
    enabled: !!boardDepartmentId,
  });
  const columns = useMemo(() => [...(board?.columns ?? [])].sort((a, b) => a.order - b.order), [board]);

  const { data: organizations } = useQuery({ queryKey: ["organizations", "my-accessible"], queryFn: () => organizationsService.myAccessible() });
  // Card de Compra (sourceKind=PURCHASE_REQUEST) nunca marca requestTypeId nos
  // tickets que gera (ver backend) — filtrar por ele aqui sempre voltaria
  // vazio, então some da lista de opções deste filtro específico.
  const { data: requestTypesRaw } = useQuery({ queryKey: ["request-types", "active"], queryFn: () => requestTypesService.listActive() });
  const requestTypes = useMemo(() => (requestTypesRaw ?? []).filter((rt) => rt.sourceKind !== RequestTypeSourceKind.PURCHASE_REQUEST), [requestTypesRaw]);

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      priority: priority !== "all" ? priority : undefined,
      organizationId: organizationId !== "all" ? organizationId : undefined,
      requestTypeId: requestTypeId !== "all" ? requestTypeId : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      unassigned: assigneeFilter === "unassigned" ? true : undefined,
      assigneeId: assigneeFilter === "me" ? user?.id : undefined,
    }),
    [debouncedSearch, priority, organizationId, requestTypeId, startDate, endDate, assigneeFilter, user?.id]
  );

  // Volta o teto por coluna ao padrão sempre que o usuário troca de filtro —
  // não faz sentido manter um teto ampliado (de um "carregar mais" anterior)
  // depois que o recorte de dados mudou.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setColumnLimit(50), [filters, boardDepartmentId]);

  const params = useMemo(
    () => ({ ...filters, board: true, columnLimit, departmentId: boardDepartmentId || undefined }),
    [filters, columnLimit, boardDepartmentId]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", "board", params],
    queryFn: () => ticketsService.list(params),
    enabled: view === "board" && !!boardDepartmentId,
  });

  const tableParams = useMemo(
    () => ({ ...filters, page: tablePage, limit: 10, sortBy: tableSortBy, sortOrder: tableSortOrder }),
    [filters, tablePage, tableSortBy, tableSortOrder]
  );

  const { data: tableData, isLoading: isTableLoading } = useQuery({
    queryKey: ["tickets", "table", tableParams],
    queryFn: () => ticketsService.list(tableParams),
    enabled: view === "table",
  });

  const ticketsByColumn = useMemo(() => {
    const grouped: Record<string, Ticket[]> = {};
    (data?.items ?? []).forEach((ticket) => {
      (grouped[ticket.columnId] ??= []).push(ticket);
    });
    return grouped;
  }, [data]);

  const canDrag = can(PermissionKey.MOVE_TICKET, PermissionKey.RESOLVE_TICKET, PermissionKey.CANCEL_TICKET);

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = (data?.items ?? []).find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;
    const ticket = (data?.items ?? []).find((t) => t.id === active.id);
    const newColumnId = over.id as string;
    if (!ticket || ticket.columnId === newColumnId) return;

    queryClient.setQueryData(["tickets", "board", params], (old: { items: Ticket[] } | undefined) => {
      if (!old) return old;
      return { ...old, items: old.items.map((t) => (t.id === ticket.id ? { ...t, columnId: newColumnId } : t)) };
    });

    try {
      await ticketsService.move(ticket.id, newColumnId);
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    } catch (error) {
      showToast({ title: "Não foi possível mover o ticket", description: extractErrorMessage(error), variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    }
  };

  const handleExport = async () => {
    const blob = await ticketsService.exportCsv(filters);
    downloadCsvBlob(blob, "tickets.csv");
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Breadcrumb items={[{ label: "Kanban" }]} />
        <FiltersBar
          view={view}
          onViewChange={setView}
          search={search}
          onSearchChange={setSearch}
          priority={priority}
          onPriorityChange={setPriority}
          organizationId={organizationId}
          onOrganizationIdChange={setOrganizationId}
          organizations={organizations}
          requestTypeId={requestTypeId}
          onRequestTypeIdChange={setRequestTypeId}
          requestTypes={requestTypes}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          assigneeFilter={assigneeFilter}
          onAssigneeFilterChange={setAssigneeFilter}
          onExport={handleExport}
          boardDepartmentId={boardDepartmentId}
          onBoardDepartmentIdChange={setBoardDepartmentId}
          boardDepartments={isPrivileged ? allDepartments : undefined}
        />
      </div>

      {view === "board" ? (
        <BoardView
          isLoading={isLoading}
          columns={columns}
          ticketsByColumn={ticketsByColumn}
          columnTotals={data?.meta?.columnTotals}
          onLoadMore={() => setColumnLimit((prev) => prev + 50)}
          canDrag={canDrag}
          sensors={sensors}
          activeTicket={activeTicket}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      ) : (
        <TableView
          data={tableData}
          isLoading={isTableLoading}
          page={tablePage}
          onPageChange={setTablePage}
          search={search}
          onSearchChange={setSearch}
          sortBy={tableSortBy}
          sortOrder={tableSortOrder}
          onSortChange={(nextSortBy, nextSortOrder) => { setTableSortBy(nextSortBy); setTableSortOrder(nextSortOrder); setTablePage(1); }}
        />
      )}
    </div>
  );
}
