import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import type { CashDrawer, CashMovementPayload, CashMovementType } from "@/api/cashDrawers";
import type { ExpenseCategory } from "@/types/models";
import { EXPENSE_CATEGORY_LABELS } from "@/features/expenses/categories";
import { isOutflow, MOVEMENT_HINTS, MOVEMENT_LABELS } from "./movementLabels";

const TYPES: CashMovementType[] = ["expense", "withdrawal", "deposit"];


export function CashMovementDialog({
  drawer,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  drawer: CashDrawer | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (drawer: CashDrawer, payload: CashMovementPayload) => void;
  submitting: boolean;
}) {
  const [type, setType] = useState<CashMovementType>("expense");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");

  useEffect(() => {
    if (drawer) {
      setType("expense");
      setAmount("");
      setReason("");
      setCategory("other");
    }
   
  }, [drawer?.id]);

  const amountNum = Number(amount);
  const amountValid = amount.trim() !== "" && Number.isFinite(amountNum) && amountNum > 0;
  const expectedCents = Math.round(Number(drawer?.expected_cash ?? 0) * 100);
  const amountCents = amountValid ? Math.round(amountNum * 100) : 0;
  const exceeds = isOutflow(type) && amountValid && amountCents > expectedCents;
  const afterCents = expectedCents + (isOutflow(type) ? -amountCents : amountCents);
  const canSubmit = amountValid && reason.trim() !== "" && !exceeds && !submitting;

  const submit = () => {
    if (!drawer || !canSubmit) return;
    onSubmit(drawer, {
      type,
      amount: amountNum,
      reason: reason.trim(),
      ...(type === "expense" ? { category } : {}),
    });
  };

  return (
    <Dialog open={!!drawer} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>حركة نقدية على الصندوق</DialogTitle>
          <DialogDescription>{MOVEMENT_HINTS[type]}</DialogDescription>
        </DialogHeader>

        {drawer && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="نوع الحركة">
              {TYPES.map((t) => (
                <Button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={type === t}
                  variant={type === t ? "default" : "outline"}
                  onClick={() => setType(t)}
                >
                  {MOVEMENT_LABELS[t]}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movement_amount">المبلغ</Label>
              <Input
                id="movement_amount"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {exceeds && (
                <p className="text-xs text-[var(--color-danger)]">
                  المبلغ أكبر من الكاش المتوقع بالصندوق ({formatCurrency(expectedCents / 100)})
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="movement_reason">السبب</Label>
              <Input
                id="movement_reason"
                maxLength={255}
                placeholder={type === "expense" ? "مثال: دفعت للمورّد (خضار)" : type === "withdrawal" ? "مثال: سحب للخزنة" : "مثال: تزويد فراطة"}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
              />
            </div>

            {type === "expense" && (
              <div className="flex flex-col gap-1.5">
                <Label>تصنيف المصروف</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExpenseCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {amountValid && !exceeds && (
              <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-wine-50)] px-4 py-3 text-sm" aria-live="polite">
                <span className="text-[var(--color-ink-soft)]">المتوقع بالصندوق بعد الحركة</span>
                <span className="tabular font-semibold">{formatCurrency(afterCents / 100)}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" disabled={!canSubmit} onClick={submit}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            تسجيل الحركة
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
