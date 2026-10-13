export type UserRole = "admin" | "manager" | "cashier" | "waiter" | "chef" | "driver";

export type Permission =
  | "reports.view"
  | "reports.export"
  | "orders.view"
  | "orders.manage"
  | "invoices.print"
  | "users.manage"
  | "expenses.view"
  | "expenses.manage"
  | "settings.manage"
  | "tables.manage"
  | "reservations.manage"
  | "menu.manage"
  | "refunds.approve"
  | "reviews.approve"
  | "shifts.manage_own"
  | "shifts.manage_all"
  | "schedules.view_own"
  | "schedules.manage"
  | "audit.view"
  | "payroll.view"
  | "payroll.manage"
  | "orders.delete"
  | "payments.manage"
  | "customers.manage"
  | "coupons.manage"
  | "kitchen.manage"
  | "deliveries.manage"
  | "drawer.manage_own"
  | "drawer.manage_all";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
  must_change_password?: boolean;
  extra_permissions: Permission[] | null;
  revoked_permissions: Permission[] | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}
