import type { ExpenseCategory } from "@/types/models";

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: "إيجار",
  utilities: "فواتير (كهرباء/ماء/إنترنت)",
  salaries: "رواتب",
  supplies: "مستلزمات",
  maintenance: "صيانة",
  marketing: "تسويق",
  other: "أخرى",
};
