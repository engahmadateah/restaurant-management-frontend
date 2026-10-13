import { getSetting } from "@/stores/settingsStore";

/**
 * تنسيق العملة — رمز العملة الافتراضي يُقرأ الآن من إعدادات النظام
 * (شاشة الإعدادات -> رمز العملة)، وبيرجع لـ "د.أ" فقط إذا الإعدادات
 * لسا ما انحملت أو الحقل فاضي. فينك دايمًا تمرر عملة مختلفة يدويًا
 * عبر البارامتر الثاني إذا احتجت هيك بحالة خاصة.
 */
export function formatCurrency(value: number | string, currency?: string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(num) ? num : 0);
  const resolvedCurrency = currency ?? getSetting("currency", "د.أ");
  return `${formatted} ${resolvedCurrency}`;
}

export function formatDate(value: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ar-JO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(date);
}

export function formatTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ar-JO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTime(value: string | Date) {
  return `${formatDate(value)} - ${formatTime(value)}`;
}
