import { useAuthStore } from "@/stores/authStore";
import type { Permission, UserRole } from "@/types/auth";


const ROLE_DEFAULTS: Record<UserRole, Permission[] | ["*"]> = {
  admin: ["*"],
  manager: [
    "reports.view", "reports.export", "orders.view", "orders.manage",
    "invoices.print", "expenses.view", "expenses.manage", "tables.manage",
    "menu.manage", "refunds.approve", "reviews.approve", "reservations.manage",
    "shifts.manage_own", "shifts.manage_all",
    "schedules.view_own", "schedules.manage", "audit.view",
    "payroll.view", "payroll.manage",
    "orders.delete", "payments.manage", "customers.manage", "coupons.manage",
    "kitchen.manage", "deliveries.manage",
  ],
  cashier: [
    "orders.view", "orders.manage", "invoices.print", "reservations.manage",
    "shifts.manage_own", "schedules.view_own",
    "kitchen.manage", "deliveries.manage",
  ],
  waiter: [
    "orders.view", "orders.manage", "tables.manage", "kitchen.manage", "reservations.manage",
    "shifts.manage_own", "schedules.view_own",
  ],
  chef: ["orders.view", "kitchen.manage", "shifts.manage_own", "schedules.view_own"],
  driver: ["orders.view", "deliveries.manage", "shifts.manage_own", "schedules.view_own"],
};

function checkPermission(
  role: UserRole,
  extra: Permission[] | null,
  revoked: Permission[] | null,
  permission: Permission
): boolean {
  if (role === "admin") return true;

  const defaults = ROLE_DEFAULTS[role] as Permission[];
  const effective = new Set([...defaults, ...(extra ?? [])]);
  for (const r of revoked ?? []) effective.delete(r);

  return effective.has(permission);
}

export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return checkPermission(user.role, user.extra_permissions, user.revoked_permissions, permission);
  };

 
  const hasAnyPermission = (permission: Permission | Permission[]): boolean =>
    (Array.isArray(permission) ? permission : [permission]).some(hasPermission);

  const hasRole = (...roles: UserRole[]): boolean => (user ? roles.includes(user.role) : false);

  return { user, hasPermission, hasAnyPermission, hasRole };
}
