import { useCallback, useEffect, useMemo, useState } from "react";
import { fromCents, toCents } from "./publicUtils";

export interface CartLine {
  key: string;
  menuItemId: number;
  name: string;
  unitPrice: number;
  taxRate: number;
  quantity: number;
  modifierIds: number[];
  modifierNames: string[];
  notes: string;
}

const PREFIX = "zeitoun-public-cart-v1:";
const MAX_AGE_MS = 12 * 60 * 60 * 1000;
export const MAX_LINE_QTY = 20;

export function cartLineKey(menuItemId: number, modifierIds: number[], notes: string) {
  return `${menuItemId}|${[...modifierIds].sort((a, b) => a - b).join(",")}|${notes.trim()}`;
}

function load(storageKey: string): CartLine[] {
  try {
    const raw = localStorage.getItem(PREFIX + storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { savedAt: number; lines: CartLine[] };
    if (!Array.isArray(parsed.lines) || Date.now() - parsed.savedAt > MAX_AGE_MS) return [];
    return parsed.lines;
  } catch {
    return [];
  }
}

export function useCart(storageKey: string) {
  const [lines, setLines] = useState<CartLine[]>(() => load(storageKey));

  useEffect(() => {
    try {
      if (lines.length === 0) localStorage.removeItem(PREFIX + storageKey);
      else localStorage.setItem(PREFIX + storageKey, JSON.stringify({ savedAt: Date.now(), lines }));
    } catch {
    }
  }, [lines, storageKey]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.key === line.key);
      if (!existing) return [...prev, { ...line, quantity: Math.min(line.quantity, MAX_LINE_QTY) }];
      return prev.map((l) => (l.key === line.key ? { ...l, quantity: Math.min(l.quantity + line.quantity, MAX_LINE_QTY) } : l));
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(quantity, MAX_LINE_QTY) } : l))
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const totals = useMemo(() => {
    let subtotalC = 0;
    let taxC = 0;
    let count = 0;
    for (const l of lines) {
      const lineC = toCents(l.unitPrice) * l.quantity;
      subtotalC += lineC;
      taxC += Math.round(lineC * l.taxRate);
      count += l.quantity;
    }
    return { count, subtotal: fromCents(subtotalC), tax: fromCents(taxC) };
  }, [lines]);

  return { lines, add, setQuantity, clear, ...totals };
}
