import { Moon, Sun, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { initials } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";
import { TicketSearchBar } from "./TicketSearchBar";

export function Header({ breadcrumb, onMenuClick }: { breadcrumb?: ReactNode; onMenuClick?: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between gap-2 border-b border-border bg-background px-3 sm:px-4">
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={onMenuClick} aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0 truncate">{breadcrumb}</div>
      </div>
      <div className="hidden flex-1 justify-center px-2 sm:flex md:px-6">
        <TicketSearchBar />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.avatarDataUrl ?? undefined} alt={user?.name} />
                <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.department?.name ?? "Sem departamento"}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              <UserIcon className="h-4 w-4" /> Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
