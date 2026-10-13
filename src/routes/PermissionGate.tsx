import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission, UserRole } from "@/types/auth";

interface PermissionGateProps {
  permission?: Permission;
  role?: UserRole | UserRole[];
  fallback?: ReactNode;
  children: ReactNode;
}

/** يخفي/يظهر أي جزء بالواجهة حسب صلاحية أو دور المستخدم الحالي. */
export function PermissionGate({ permission, role, fallback = null, children }: PermissionGateProps) {
  const { hasPermission, hasRole } = usePermissions();

  if (permission && !hasPermission(permission)) return <>{fallback}</>;
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    if (!hasRole(...roles)) return <>{fallback}</>;
  }

  return <>{children}</>;
}

/** حماية على مستوى الراوت كامل - بيرجع لصفحة "غير مصرح" إذا ما في صلاحية. */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission | Permission[]; // مصفوفة = أي وحدة تكفي
  children: ReactNode;
}) {
  const { hasAnyPermission } = usePermissions();
  if (!hasAnyPermission(permission)) {
    return <Navigate to="/403" replace />;
  }
  return <>{children}</>;
}
