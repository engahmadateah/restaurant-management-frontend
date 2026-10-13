import type { Permission } from "@/types/auth";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  ChefHat,
  Armchair,
  CalendarClock,
  Users,
  Truck,
  Boxes,
  Ticket,
  BarChart3,
  Wallet,
  UserCog,
  ScrollText,
  Settings,
  Bell,
  Clock,
  Undo2,
  Star,
  TicketPercent,
  Coins,
  CreditCard,
  Landmark,
  Receipt,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;

  permission?: Permission | Permission[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "عام",
    items: [
      { label: "لوحة التحكم", to: "/", icon: LayoutDashboard },
      { label: "الإشعارات", to: "/notifications", icon: Bell },
    ],
  },
  {
    title: "العمليات",
    items: [
      { label: "الكاشير (POS)", to: "/pos", icon: ShoppingBag, permission: "orders.manage" },
      { label: "الطلبات", to: "/orders", icon: Ticket, permission: "orders.view" },
      { label: "شاشة المطبخ", to: "/kitchen", icon: ChefHat, permission: "kitchen.manage" },
      { label: "الطاولات", to: "/tables", icon: Armchair, permission: "tables.manage" },
      { label: "الحجوزات", to: "/reservations", icon: CalendarClock, permission: "reservations.manage" },
      { label: "التوصيل", to: "/deliveries", icon: Truck, permission: "deliveries.manage" },
      { label: "الصندوق", to: "/cash-drawer", icon: Landmark, permission: ["drawer.manage_own", "drawer.manage_all"] },
    ],
  },
  {
    title: "الإدارة",
    items: [
      { label: "قائمة الطعام", to: "/menu", icon: UtensilsCrossed, permission: "menu.manage" },
      { label: "المخزون", to: "/inventory", icon: Boxes, permission: "menu.manage" },
      { label: "الزبائن", to: "/customers", icon: Users, permission: "orders.manage" },
      { label: "التقارير", to: "/reports", icon: BarChart3, permission: "reports.view" },
      { label: "تقرير نهاية اليوم", to: "/z-report", icon: Receipt, permission: "reports.view" },
      { label: "الدفعات", to: "/payments", icon: CreditCard, permission: "orders.manage" },
      { label: "المصاريف", to: "/expenses", icon: Wallet, permission: "expenses.view" },
      { label: "الكوبونات", to: "/coupons", icon: TicketPercent, permission: "orders.manage" },
      { label: "الورديات والرواتب", to: "/workforce", icon: Clock },
      { label: "الاسترجاعات", to: "/refunds", icon: Undo2, permission: ["orders.manage", "refunds.approve"] },
      { label: "تقييمات الزبائن", to: "/reviews", icon: Star, permission: ["orders.manage", "reviews.approve"] },
    ],
  },
  {
    title: "النظام",
    items: [
      { label: "الموظفون", to: "/staff", icon: UserCog, permission: "users.manage" },
      { label: "سجل التدقيق", to: "/audit-log", icon: ScrollText, permission: "audit.view" },
      { label: "الإعدادات", to: "/settings", icon: Settings, permission: "settings.manage" },
      { label: "العملات", to: "/currencies", icon: Coins, permission: "settings.manage" },
    ],
  },
];
