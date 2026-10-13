import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import type { PublicMenuItem } from "@/api/publicOrdering";
import { cartLineKey, MAX_LINE_QTY, type CartLine } from "./useCart";
import { fromCents, toCents } from "./publicUtils";

export function ItemDialog({
  item,
  currency,
  canOrder,
  onOpenChange,
  onAdd,
}: {
  item: PublicMenuItem | null;
  currency: string;
  canOrder: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (line: CartLine) => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [notes, setNotes] = useState("");

  const chosen = useMemo(() => {
    if (!item) return [];
    return item.modifier_groups.flatMap((g) => g.modifiers.filter((m) => selected[g.id]?.includes(m.id)));
  }, [item, selected]);

  if (!item) {
    return <Dialog open={false} onOpenChange={onOpenChange} />;
  }

  const missingRequired = item.modifier_groups.find((g) => g.is_required && g.modifiers.length > 0 && !(selected[g.id]?.length > 0));
  const unitC = toCents(item.price) + chosen.reduce((sum, m) => sum + toCents(m.extra_price), 0);
  const canAdd = canOrder && !item.sold_out && !missingRequired;

  function toggle(groupId: number, modifierId: number, max: number | null) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(modifierId)) return { ...prev, [groupId]: current.filter((id) => id !== modifierId) };
      if (max === 1) return { ...prev, [groupId]: [modifierId] };
      if (max !== null && current.length >= max) return prev;
      return { ...prev, [groupId]: [...current, modifierId] };
    });
  }

  function submit() {
    if (!item || !canAdd) return;
    const modifierIds = chosen.map((m) => m.id);
    const trimmed = notes.trim();
    onAdd({
      key: cartLineKey(item.id, modifierIds, trimmed),
      menuItemId: item.id,
      name: item.name,
      unitPrice: fromCents(unitC),
      taxRate: item.tax_rate,
      quantity,
      modifierIds,
      modifierNames: chosen.map((m) => m.name),
      notes: trimmed,
    });
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>{item.description || formatCurrency(item.price, currency)}</DialogDescription>
        </DialogHeader>

        {item.image && (
          <img src={`/storage/${item.image}`} alt={item.name} className="h-44 w-full rounded-[var(--radius-md)] object-cover" />
        )}

        {item.modifier_groups
          .filter((g) => g.modifiers.length > 0)
          .map((group) => (
            <fieldset key={group.id} className="flex flex-col gap-2">
              <legend className="mb-1 flex items-center gap-2 text-sm font-semibold">
                {group.name}
                <span className="text-xs font-normal text-[var(--color-ink-soft)]">
                  {group.is_required ? "مطلوب" : "اختياري"}
                  {group.max_selections && group.max_selections > 1 ? ` — حتى ${group.max_selections}` : ""}
                </span>
              </legend>
              {group.modifiers.map((m) => {
                const on = selected[group.id]?.includes(m.id) ?? false;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role={group.max_selections === 1 ? "radio" : "checkbox"}
                    aria-checked={on}
                    onClick={() => toggle(group.id, m.id, group.max_selections)}
                    className={`flex items-center justify-between rounded-[var(--radius-sm)] border px-3 py-2.5 text-sm transition-colors ${
                      on
                        ? "border-[var(--color-wine-600)] bg-[var(--color-wine-50)] font-medium"
                        : "border-[var(--color-line)] bg-white"
                    }`}
                  >
                    <span>{m.name}</span>
                    {m.extra_price > 0 && <span className="tabular text-[var(--color-ink-soft)]">+ {formatCurrency(m.extra_price, currency)}</span>}
                  </button>
                );
              })}
            </fieldset>
          ))}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="item-notes" className="text-sm font-semibold">
            ملاحظة (اختياري)
          </label>
          <Textarea id="item-notes" rows={2} maxLength={200} placeholder="مثال: بدون بصل" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 rounded-full border border-[var(--color-line)] px-2 py-1">
            <Button type="button" variant="ghost" size="icon" aria-label="أنقص" disabled={quantity <= 1} onClick={() => setQuantity((q) => q - 1)}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="tabular w-6 text-center font-semibold">{quantity}</span>
            <Button type="button" variant="ghost" size="icon" aria-label="زيّد" disabled={quantity >= MAX_LINE_QTY} onClick={() => setQuantity((q) => q + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" className="flex-1" disabled={!canAdd} onClick={submit}>
            {item.sold_out ? "خلص" : !canOrder ? "الطلب غير متاح" : missingRequired ? `اختر: ${missingRequired.name}` : `أضف — ${formatCurrency(fromCents(unitC * quantity), currency)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
