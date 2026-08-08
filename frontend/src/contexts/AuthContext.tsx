import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { AuthUser } from "@/types";
import { authService } from "@/services/auth.service";
import { TOKEN_STORAGE_KEY, REFRESH_STORAGE_KEY, clearSession } from "@/services/api";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (...keys: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authService.me();
      setUser(me);
    } catch {
      clearSession();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    const handleExpired = () => setUser(null);
    window.addEventListener("psc:session-expired", handleExpired);
    return () => window.removeEventListener("psc:session-expired", handleExpired);
  }, [loadUser]);

  const login = useCallback(async (login: string, password: string) => {
    const result = await authService.login(login, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
    localStorage.setItem(REFRESH_STORAGE_KEY, result.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
      setUser(null);
    }
  }, []);

  const hasPermission = useCallback(
    (...keys: string[]) => {
      if (!user) return false;
      if (user.isAdmin) return true;
      const granted = user.department?.permissions ?? [];
      if (granted.includes("SYSTEM_ADMIN" as never)) return true;
      return keys.some((key) => granted.includes(key as never));
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser: loadUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
