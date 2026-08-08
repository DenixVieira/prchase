import { useAuth } from "@/contexts/AuthContext";
import { PermissionKey } from "@/types";

export function usePermission() {
  const { hasPermission } = useAuth();
  return { can: (...keys: PermissionKey[]) => hasPermission(...keys) };
}
