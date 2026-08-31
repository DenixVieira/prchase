import { NavLink, useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard, FileText, Trello, Archive, Users, Building2, Settings, ShieldCheck, ChevronsLeft, ChevronsRight, ChevronDown, ShoppingCart, Globe2, X, FileArchive, HardDrive, PlusCircle, ListChecks, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/hooks/usePermission";
import { PermissionKey } from "@/types";

interface NavItem {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permissions?: PermissionKey[];
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Fora de qualquer grupo, sempre no topo — é a tela inicial, não faz sentido
// dentro de uma categoria (nem "Compras": ela mistura métricas com o resto
// da navegação diária).
const TOP_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, permissions: [PermissionKey.VIEW_DASHBOARD] },
];

const NAV_GROUPS: NavGroup[] = [
  {
    // Fluxo diário: abrir e acompanhar solicitações, de qualquer tipo —
    // primeiro grupo por ser o mais usado no dia a dia.
    label: "Solicitações",
    items: [
      { label: "Nova Solicitação", to: "/requests/new", icon: PlusCircle, permissions: [PermissionKey.CREATE_REQUEST, PermissionKey.CREATE_PURCHASE_REQUEST] },
      // Acompanhamento pessoal: tickets abertos a partir de solicitações do
      // próprio usuário, cruzando departamentos — diferente do Kanban abaixo,
      // que é escopado ao departamento dele.
      { label: "Meus Tickets", to: "/my-tickets", icon: ClipboardList, permissions: [PermissionKey.VIEW_TICKET] },
      { label: "Kanban", to: "/tickets", icon: Trello, permissions: [PermissionKey.VIEW_TICKET] },
      { label: "Arquivados", to: "/tickets/archived", icon: Archive, permissions: [PermissionKey.VIEW_ARCHIVED_TICKETS] },
    ],
  },
  {
    // Só o que é exclusivo do fluxo de Compra (histórico + notas fiscais) —
    // Kanban/Arquivados/Nova Solicitação já deixaram de ser específicos dela.
    label: "Compras",
    items: [
      { label: "Solicitações de Compra", to: "/purchase-requests", icon: FileText, permissions: [PermissionKey.VIEW_PURCHASE_REQUEST] },
      { label: "Notas Fiscais", to: "/invoices/export", icon: FileArchive, permissions: [PermissionKey.EXPORT_INVOICES] },
    ],
  },
  {
    label: "Estoque",
    items: [
      { label: "Equipamentos", to: "/devices", icon: HardDrive, permissions: [PermissionKey.VIEW_DEVICE] },
    ],
  },
  {
    // Administração do sistema — por último de propósito, é a categoria
    // menos acessada no dia a dia da maioria dos usuários.
    label: "Sistema",
    items: [
      { label: "Usuários", to: "/users", icon: Users, permissions: [PermissionKey.MANAGE_USERS] },
      { label: "Departamentos", to: "/departments", icon: Building2, permissions: [PermissionKey.MANAGE_DEPARTMENTS] },
      { label: "Organizações", to: "/organizations", icon: Globe2, permissions: [PermissionKey.MANAGE_DEPARTMENTS] },
      { label: "Tipos de Solicitação", to: "/admin/request-types", icon: ListChecks, permissions: [PermissionKey.MANAGE_REQUEST_TYPES] },
      { label: "Auditoria", to: "/audit", icon: ShieldCheck, permissions: [PermissionKey.SYSTEM_ADMIN, PermissionKey.MANAGE_SETTINGS] },
      { label: "Configurações", to: "/settings", icon: Settings, permissions: [PermissionKey.MANAGE_SETTINGS] },
    ],
  },
];

const OPEN_GROUPS_STORAGE_KEY = "sidebar-open-groups";

function useAutoCollapse() {
  const [collapsed, setCollapsed] = useState(false);

  // Abaixo de 1024px (tablet) o espaço horizontal já fica apertado pra
  // sidebar expandida convivir com o conteúdo — recolhe automaticamente pra
  // modo ícone. Só força ao encolher; a expansão manual do usuário em telas
  // largas continua funcionando normalmente.
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const syncToViewport = () => {
      if (mql.matches) setCollapsed(true);
    };
    syncToViewport();
    mql.addEventListener("change", syncToViewport);
    return () => mql.removeEventListener("change", syncToViewport);
  }, []);

  return [collapsed, setCollapsed] as const;
}

function useVisibleTopItems(): NavItem[] {
  const { can } = usePermission();
  return TOP_ITEMS.filter((item) => !item.permissions || can(...item.permissions));
}

function useVisibleNavGroups(): NavGroup[] {
  const { can } = usePermission();
  return NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.permissions || can(...item.permissions)) }))
    .filter((group) => group.items.length > 0);
}

/** Estado de expandido/recolhido por categoria, persistido no localStorage
 * e sincronizado para sempre manter visível o grupo da rota ativa (mesmo
 * que o usuário o tenha recolhido numa sessão anterior). */
function useOpenGroups(groups: NavGroup[]) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(OPEN_GROUPS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const activeGroup = groups.find((group) => group.items.some((item) => location.pathname.startsWith(item.to)));
    if (activeGroup && openGroups[activeGroup.label] === false) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.label]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, groups]);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [label]: prev[label] === false ? true : false };
      try {
        localStorage.setItem(OPEN_GROUPS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // modo privado ou storage indisponível — apenas não persiste
      }
      return next;
    });
  };

  const isOpen = (label: string) => openGroups[label] !== false;

  return { isOpen, toggleGroup };
}

function NavItemLink({ item, showLabel, onNavigate }: { item: NavItem; showLabel: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {showLabel && <span className="truncate">{item.label}</span>}
    </NavLink>
  );
}

function NavGroups({ topItems, groups, showLabel, onNavigate }: { topItems: NavItem[]; groups: NavGroup[]; showLabel: boolean; onNavigate?: () => void }) {
  const { isOpen, toggleGroup } = useOpenGroups(groups);

  // No modo ícone (rail recolhido) não há espaço para o cabeçalho da
  // categoria — mostra todos os itens direto, sem agrupamento visual.
  if (!showLabel) {
    return (
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {topItems.map((item) => <NavItemLink key={item.to} item={item} showLabel={false} onNavigate={onNavigate} />)}
        {groups.flatMap((group) => group.items).map((item) => (
          <NavItemLink key={item.to} item={item} showLabel={false} onNavigate={onNavigate} />
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex-1 space-y-3 overflow-y-auto p-2">
      {topItems.length > 0 && (
        <div className="space-y-1 border-b border-border pb-3">
          {topItems.map((item) => <NavItemLink key={item.to} item={item} showLabel onNavigate={onNavigate} />)}
        </div>
      )}
      {groups.map((group) => {
        const open = isOpen(group.label);
        return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              className="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              {group.label}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !open && "-rotate-90")} />
            </button>
            {open && (
              <div className="mt-1 space-y-1">
                {group.items.map((item) => <NavItemLink key={item.to} item={item} showLabel onNavigate={onNavigate} />)}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function BrandRow({ showLabel, action }: { showLabel: boolean; action?: ReactNode }) {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-border px-4">
      <ShoppingCart className="h-5 w-5 text-primary shrink-0" />
      {showLabel && <span className="font-semibold text-sm truncate flex-1">Gestão de Compras</span>}
      {action}
    </div>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const [collapsed, setCollapsed] = useAutoCollapse();
  const visibleTopItems = useVisibleTopItems();
  const visibleGroups = useVisibleNavGroups();

  return (
    <>
      {/* Rail fixo, sempre visível a partir de md (>=768px). A largura segue
          o estado "collapsed" (já sincronizado com o breakpoint acima), sem
          nenhuma classe responsiva sobrepondo a mesma propriedade — evita o
          bug de build onde um "md:w-*" perde pra classe base equivalente. */}
      <aside className={cn("hidden md:flex h-screen flex-col border-r border-border bg-card transition-all duration-200", collapsed ? "w-16" : "w-60")}>
        <BrandRow showLabel={!collapsed} />
        <NavGroups topItems={visibleTopItems} groups={visibleGroups} showLabel={!collapsed} />
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex items-center justify-center gap-2 border-t border-border p-3 text-xs text-muted-foreground hover:bg-accent"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Recolher</>}
        </button>
      </aside>

      {/* Drawer do celular: só existe no DOM quando aberto, então não há
          alternância de visibilidade via CSS entre breakpoints pra dar errado. */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onCloseMobile} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-border bg-card md:hidden">
            <BrandRow
              showLabel
              action={
                <button onClick={onCloseMobile} className="p-1 -mr-1 text-muted-foreground" aria-label="Fechar menu">
                  <X className="h-5 w-5" />
                </button>
              }
            />
            <NavGroups topItems={visibleTopItems} groups={visibleGroups} showLabel onNavigate={onCloseMobile} />
          </aside>
        </>
      )}
    </>
  );
}
