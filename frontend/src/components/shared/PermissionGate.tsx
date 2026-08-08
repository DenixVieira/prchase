import { ReactNode } from "react";
import { usePermission } from "@/hooks/usePermission";
import { PermissionKey } from "@/types";

interface PermissionGateProps {
  permissions: PermissionKey[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permissions, children, fallback = null }: PermissionGateProps) {
  const { can } = usePermission();
  return can(...permissions) ? <>{children}</> : <>{fallback}</>;
}
