import type { Permission } from "@/types/auth";

// تسمية عربية لكل صلاحية دقيقة - لازم تبقى مطابقة لـ config/permissions.php['all'] بالباك اند.
export const PERMISSION_LABELS: Record<Permission, string> = {
  "reports.view": "عرض التقارير",
  "reports.export": "تصدير التقارير",
  "orders.view": "عرض الطلبات",
  "orders.manage": "إدارة الطلبات (POS)",
  "invoices.print": "طباعة الفواتير",
  "users.manage": "إدارة الموظفين",
  "expenses.view": "عرض المصاريف",
  "expenses.manage": "إدارة المصاريف",
  "settings.manage": "إدارة الإعدادات والعملات",
  "tables.manage": "إدارة الطاولات والطوابق",
  "reservations.manage": "إدارة الحجوزات",
  "menu.manage": "إدارة المنيو والمخزون",
  "refunds.approve": "الموافقة على الاسترجاعات",
  "reviews.approve": "الموافقة على التقييمات",
  "shifts.manage_own": "تسجيل الدوام الشخصي (حضور/انصراف)",
  "shifts.manage_all": "إدارة دوام كل الموظفين",
  "schedules.view_own": "عرض جدول الدوام الشخصي",
  "schedules.manage": "إدارة جداول الدوام",
  "audit.view": "عرض سجل التدقيق",
  "payroll.view": "عرض الرواتب",
  "payroll.manage": "إدارة الرواتب (توليد/اعتماد/دفع)",
  "orders.delete": "حذف الطلبات",
  "payments.manage": "حذف/تعديل الدفعات",
  "customers.manage": "حذف الزبائن وتعديل نقاط الولاء",
  "coupons.manage": "إدارة الكوبونات",
  "kitchen.manage": "شاشة المطبخ (بدء/جاهز/تسليم)",
  "deliveries.manage": "التوصيل (عرض وتحديث حالة التسليم)",
  "drawer.manage_own": "صندوق الكاشير الشخصي (فتح/إغلاق)",
  "drawer.manage_all": "إدارة كل الصناديق (عرض/إغلاق عن الغير)",
};

// تجميع الصلاحيات لمجموعات منطقية بواجهة تعديل صلاحيات الموظف
export const PERMISSION_GROUPS: { title: string; permissions: Permission[] }[] = [
  {
    title: "الطلبات والفواتير",
    permissions: ["orders.view", "orders.manage", "invoices.print", "orders.delete", "payments.manage"],
  },
  { title: "المطبخ والتوصيل", permissions: ["kitchen.manage", "deliveries.manage"] },
  { title: "الصندوق", permissions: ["drawer.manage_own", "drawer.manage_all"] },
  { title: "المنيو والطاولات والحجوزات", permissions: ["menu.manage", "tables.manage", "reservations.manage"] },
  {
    title: "الزبائن والكوبونات والتقييمات",
    permissions: ["customers.manage", "coupons.manage", "refunds.approve", "reviews.approve"],
  },
  { title: "المصاريف والتقارير", permissions: ["expenses.view", "expenses.manage", "reports.view", "reports.export"] },
  {
    title: "الدوام والرواتب",
    permissions: [
      "shifts.manage_own",
      "shifts.manage_all",
      "schedules.view_own",
      "schedules.manage",
      "payroll.view",
      "payroll.manage",
    ],
  },
  // إدارة الموظفين (users.manage) admin فقط بالباك، فما بتنعرض هون كصلاحية قابلة للمنح
  { title: "الإدارة العامة", permissions: ["settings.manage", "audit.view"] },
];
