import type { AuditAction } from "@/api/auditLog";

export const ACTION_LABELS: Record<AuditAction, string> = {
  created: "إنشاء",
  updated: "تعديل",
  deleted: "حذف",
};

export const ACTION_BADGE: Record<AuditAction, "success" | "info" | "danger"> = {
  created: "success",
  updated: "info",
  deleted: "danger",
};


export const MODEL_LABELS: Record<string, string> = {
  Order: "طلب",
  Payment: "دفعة",
  Refund: "استرجاع",
  Expense: "مصروف",
  CashDrawer: "صندوق",
  CashMovement: "حركة نقدية",
  Payroll: "كشف راتب",
  ShiftSchedule: "جدولة وردية",
  MenuItem: "صنف",
  Coupon: "كوبون",
  Currency: "عملة",
  Setting: "إعداد",
  User: "موظف",
  Floor: "طابق",
  Customer: "زبون",
  Reservation: "حجز",
  Shift: "وردية دوام",
  Category: "تصنيف",
  Modifier: "خيار إضافي",
  ModifierGroup: "مجموعة خيارات",
  RestaurantTable: "طاولة",
};

export const modelLabel = (short: string) => MODEL_LABELS[short] ?? short;


export const FIELD_LABELS: Record<string, string> = {
  name: "الاسم",
  email: "البريد",
  role: "الدور",
  is_active: "مفعّل",
  status: "الحالة",
  amount: "المبلغ",
  total: "الإجمالي",
  subtotal: "المجموع الفرعي",
  discount: "الخصم",
  tax: "الضريبة",
  price: "السعر",
  method: "طريقة الدفع",
  type: "النوع",
  title: "العنوان",
  category: "التصنيف",
  reason: "السبب",
  notes: "ملاحظات",
  code: "الكود",
  value: "القيمة",
  opening_float: "رصيد البداية",
  cash_sales: "مبيعات نقدية",
  cash_refunds: "استرجاعات نقدية",
  cash_expenses: "مصاريف نقدية",
  cash_withdrawals: "سحوبات",
  cash_deposits: "إيداعات",
  expected_cash: "المتوقع",
  counted_cash: "المعدود",
  difference: "الفرق",
  closed_at: "وقت الإغلاق",
  user_id: "رقم الموظف",
  order_id: "رقم الطلب",
  payment_id: "رقم الدفعة",
  phone: "الهاتف",
  address: "العنوان",
  loyalty_points: "نقاط الولاء",
  customer_name: "اسم الزبون",
  customer_phone: "هاتف الزبون",
  table_id: "رقم الطاولة",
  party_size: "عدد الأشخاص",
  reservation_date: "تاريخ الحجز",
  reservation_time: "وقت الحجز",
  clock_in: "وقت الدخول",
  clock_out: "وقت الخروج",
  auto_closed: "أُغلقت تلقائياً",
  adjusted_by: "عدّلها",
  tax_rate: "نسبة الضريبة",
  extra_price: "السعر الإضافي",
  is_available: "متوفر",
  is_required: "إلزامي",
  max_selections: "أقصى اختيارات",
  sort_order: "الترتيب",
  slug: "الرابط المختصر",
};

export const fieldLabel = (key: string) => FIELD_LABELS[key] ?? key;
