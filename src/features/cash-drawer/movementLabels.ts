import type { CashMovementType } from "@/api/cashDrawers";

export const MOVEMENT_LABELS: Record<CashMovementType, string> = {
  expense: "مصروف",
  withdrawal: "سحب",
  deposit: "إيداع",
};

export const MOVEMENT_HINTS: Record<CashMovementType, string> = {
  expense: "دفعت من الدرج (مثلاً للمورّد)، وبينسجّل كمان بالمصاريف",
  withdrawal: "كاش طلع من الصندوق (مثلاً للخزنة أو للبنك)",
  deposit: "كاش انضاف للصندوق (مثلاً تزويد فراطة)",
};


export const isOutflow = (type: CashMovementType) => type !== "deposit";
