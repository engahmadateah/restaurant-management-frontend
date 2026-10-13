import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/format";
import type { MenuItem, ModifierGroup } from "@/types/models";
import type { CartLineModifier } from "./types";


type SelectionState = Record<number, number[]>;

export function PosModifierDialog({
  open,
  onOpenChange,
  item,
  groups,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: MenuItem | null;

  groups: ModifierGroup[] | undefined;
  onConfirm: (modifiers: CartLineModifier[]) => void;
}) {
  const [selected, setSelected] = useState<SelectionState>({});

  useEffect(() => {
    if (open) setSelected({});
  }, [open, item?.id]);

  function toggle(groupId: number, modifierId: number, maxSelections: number) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (current.includes(modifierId)) {
        return { ...prev, [groupId]: current.filter((id) => id !== modifierId) };
      }
 
      const next = maxSelections === 1 ? [modifierId] : [...current, modifierId];
      return { ...prev, [groupId]: next };
    });
  }

  function handleConfirm() {
    const chosen: CartLineModifier[] = [];
    for (const group of groups ?? []) {
      const ids = selected[group.id] ?? [];
      for (const modifier of group.modifiers ?? []) {
        if (ids.includes(modifier.id)) {
          chosen.push({ id: modifier.id, name: modifier.name, extra_price: Number(modifier.extra_price) });
        }
      }
    }
    onConfirm(chosen);
  }


  const missingRequired = (groups ?? []).some(
    (g) =>
      g.is_required &&
      (g.modifiers ?? []).some((m) => m.is_available) &&
      (selected[g.id] ?? []).length === 0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{item?.name}</DialogTitle>
          <DialogDescription>اختر الإضافات المطلوبة قبل ما تضيفها للسلة</DialogDescription>
        </DialogHeader>

        {(groups ?? []).length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--color-ink-soft)]">هاد الصنف ما إله خيارات إضافية</p>
        )}

        <div className="flex max-h-[50vh] flex-col gap-5 overflow-y-auto">
          {groups?.map((group) => {
            const ids = selected[group.id] ?? [];
            const atMax = group.max_selections > 0 && ids.length >= group.max_selections;
            return (
              <div key={group.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[var(--color-ink)]">
                    {group.name}
                    {group.is_required && <span className="text-[var(--color-danger)]"> *</span>}
                  </p>
                  <span className="text-xs text-[var(--color-ink-soft)]">
                    {group.max_selections === 1 ? "اختيار واحد" : `حتى ${group.max_selections}`}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {group.modifiers?.map((modifier) => {
                    const checked = ids.includes(modifier.id);
                    const disabled = !checked && atMax && group.max_selections !== 1;
                    return (
                      <label
                        key={modifier.id}
                        className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={checked}
                            disabled={disabled || !modifier.is_available}
                            onCheckedChange={() => toggle(group.id, modifier.id, group.max_selections)}
                          />
                          {modifier.name}
                          {!modifier.is_available && (
                            <span className="text-xs text-[var(--color-danger)]">(غير متوفر)</span>
                          )}
                        </span>
                        {Number(modifier.extra_price) > 0 && (
                          <span className="tabular text-xs text-[var(--color-ink-soft)]">
                            +{formatCurrency(modifier.extra_price)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={missingRequired}>
            إضافة للسلة
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              إلغاء
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
