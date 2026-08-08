import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Lock, Unlock, KeyRound, MoreHorizontal } from "lucide-react";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { DataTable, DataTableColumn } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { usersService } from "@/services/users.service";
import { departmentsService } from "@/services/departments.service";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/useToast";
import { extractErrorMessage } from "@/services/api";
import { User } from "@/types";
import { CreateUserDialog } from "./CreateUserDialog";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const debouncedSearch = useDebounce(search);

  const { data: departments } = useQuery({ queryKey: ["departments", "all"], queryFn: () => departmentsService.list({ limit: 100 }) });

  const params = useMemo(
    () => ({ page, limit: 10, search: debouncedSearch || undefined, sortBy, sortOrder }),
    [page, debouncedSearch, sortBy, sortOrder]
  );
  const { data, isLoading } = useQuery({ queryKey: ["users", params], queryFn: () => usersService.list(params) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const toggleActive = async (user: User) => {
    try {
      if (user.isActive) await usersService.block(user.id);
      else await usersService.unblock(user.id);
      invalidate();
    } catch (error) {
      showToast({ title: "Erro ao atualizar usuário", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const handleChangeDepartment = async (user: User, departmentId: string) => {
    try {
      await usersService.changeDepartment(user.id, departmentId);
      invalidate();
      showToast({ title: "Departamento atualizado", variant: "success" });
    } catch (error) {
      showToast({ title: "Erro ao alterar departamento", description: extractErrorMessage(error), variant: "destructive" });
    }
  };

  const columns: DataTableColumn<User>[] = [
    { key: "name", header: "Nome", sortKey: "name", render: (u) => <span className="font-medium">{u.name}</span> },
    { key: "login", header: "Login", sortKey: "login", render: (u) => u.login },
    { key: "email", header: "E-mail", sortKey: "email", render: (u) => u.email },
    {
      key: "department", header: "Departamento", render: (u) => (
        <Select value={u.departmentId ?? undefined} onValueChange={(value) => handleChangeDepartment(u, value)}>
          <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="Sem departamento" /></SelectTrigger>
          <SelectContent>
            {(departments?.items ?? []).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      ),
    },
    { key: "status", header: "Status", sortKey: "isActive", render: (u) => <Badge variant={u.isActive ? "success" : "destructive"}>{u.isActive ? "Ativo" : "Bloqueado"}</Badge> },
    { key: "admin", header: "Admin", sortKey: "isAdmin", render: (u) => (u.isAdmin ? <Badge variant="secondary">Administrador</Badge> : "—") },
    {
      key: "actions", header: "", render: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleActive(u)}>
              {u.isActive ? <><Lock className="h-4 w-4" /> Bloquear</> : <><Unlock className="h-4 w-4" /> Desbloquear</>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setResetPasswordTarget(u)}>
              <KeyRound className="h-4 w-4" /> Redefinir senha
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Breadcrumb items={[{ label: "Usuários" }]} />
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> Novo Usuário</Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        meta={data?.meta}
        page={page}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        isLoading={isLoading}
        rowKey={(u) => u.id}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextSortBy, nextSortOrder) => { setSortBy(nextSortBy); setSortOrder(nextSortOrder); setPage(1); }}
      />

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ResetPasswordDialog user={resetPasswordTarget} onOpenChange={(open) => !open && setResetPasswordTarget(null)} />
    </div>
  );
}
