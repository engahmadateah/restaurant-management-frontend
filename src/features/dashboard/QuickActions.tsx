import { Link } from "react-router-dom";
import { ShoppingBag, Ticket, ChefHat, Truck, CalendarClock, Boxes, Users } from "lucide-react";
import type { ComponentType } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/types/auth";

interface QuickAction {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  permission?: Permission;
}


const ACTIONS: QuickAction[] = [
  { label: "طلب جديد", to: "/pos", icon: ShoppingBag, permission: "orders.manage" },
  { label: "الطلبات", to: "/orders", icon: Ticket, permission: "orders.view" },
  { label: "شاشة المطبخ", to: "/kitchen", icon: ChefHat, permission: "kitchen.manage" },
  { label: "التوصيل", to: "/deliveries", icon: Truck, permission: "deliveries.manage" },
  { label: "الحجوزات", to: "/reservations", icon: CalendarClock, permission: "reservations.manage" },
  { label: "المخزون", to: "/inventory", icon: Boxes, permission: "menu.manage" },
  { label: "الزبائن", to: "/customers", icon: Users, permission: "orders.manage" },
];

export function QuickActions() {
  const { hasPermission } = usePermissions();
  const visible = ACTIONS.filter((a) => !a.permission || hasPermission(a.permission));
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((a, i) => (
        <Link
          key={a.to}
          to={a.to}
          className={
            i === 0 && a.to === "/pos"
              ? "flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-wine-600)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-wine-700)]"
              : "flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-wine-50)]"
          }
        >
          <a.icon className="h-4 w-4" />
          {a.label}
        </Link>
      ))}
    </div>
  );
}
