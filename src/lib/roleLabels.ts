import type { UserRole } from "@/types/auth";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "أدمن",
  manager: "مدير",
  cashier: "كاشير",
  waiter: "نادل",
  chef: "شيف",
  driver: "سائق",
};
