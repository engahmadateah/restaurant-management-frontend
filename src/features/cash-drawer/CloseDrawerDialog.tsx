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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import type { CashDrawer } from "@/api/cashDrawers";


export function CloseDrawerDialog({
  drawer,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  drawer: CashDrawer | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (drawer: CashDrawer, payload: { counted_cash: number; notes?: string }) => void;
  submitting: boolean;
}) {
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (drawer) {
      setCounted("");
      setNotes("");
    }
  }, [drawer]);

  const expectedCents = Math.round(Number(drawer?.expected_cash ?? 0) * 100);
  const countedNum = Number(counted);
  const hasCounted = counted.trim() !== "" && Number.isFinite(countedNum) && countedNum >= 0;
  const diffCents = hasCounted ? Math.round(countedNum * 100) - expectedCents : 0;
  const needsNote = hasCounted && diffCents !== 0;
  const missingNote = needsNote && notes.trim() === "";

  return (
    <Dialog open={!!drawer} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>إغلاق الصندوق</DialogTitle>
          <DialogDescription>
            {drawer?.user?.name ? `صندوق ${drawer.user.name} — ` : ""}
            عدّ الكاش الموجود فعلياً بالدرج واكتب المبلغ
          </DialogDescription>
        </DialogHeader>

        {drawer && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-wine-50)] px-4 py-3 text-sm">
              <Line label="رصيد البداية" value={formatCurrency(drawer.opening_float)} />
              <Line label="+ مبيعات نقدية" value={formatCurrency(drawer.cash_sales ?? 0)} />
              <Line label="− استرجاعات نقدية" value={formatCurrency(drawer.cash_refunds ?? 0)} />
              <Line label="− مصاريف نقدية" value={formatCurrency(drawer.cash_expenses ?? 0)} />
              <Line label="− سحوبات" value={formatCurrency(drawer.cash_withdrawals ?? 0)} />
              <Line label="+ إيداعات" value={formatCurrency(drawer.cash_deposits ?? 0)} />
              <div className="mt-1 flex items-center justify-between border-t border-[var(--color-line)] pt-2 font-semibold">
                <span>المتوقع بالصندوق</span>
                <span className="tabular">{formatCurrency(drawer.expected_cash ?? 0)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="counted_cash">الكاش المعدود</Label>
              <Input
                id="counted_cash"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                autoFocus
                value={counted}
                onChange={(e) => setCounted(e.target.value)}
              />
            </div>

            {hasCounted && (
              <div
                className={`flex items-center justify-between rounded-[var(--radius-md)] border px-4 py-3 ${
                  diffCents === 0
                    ? "border-[var(--color-success)] text-[var(--color-success)]"
                    : diffCents < 0
                      ? "border-[var(--color-danger)] text-[var(--color-danger)]"
                      : "border-[var(--color-warning)] text-[var(--color-warning)]"
                }`}
                aria-live="polite"
              >
                <span className="text-sm">{diffCents === 0 ? "مطابق" : diffCents < 0 ? "عجز" : "زيادة"}</span>
                <span className="tabular text-lg font-bold">{formatCurrency(Math.abs(diffCents) / 100)}</span>
              </div>
            )}

            {needsNote && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="drawer_notes">ملاحظة (مطلوبة لأن في فرق)</Label>
                <Textarea
                  id="drawer_notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اشرح سبب الفرق..."
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            disabled={!hasCounted || missingNote || submitting}
            onClick={() =>
              drawer &&
              onSubmit(drawer, { counted_cash: countedNum, notes: notes.trim() === "" ? undefined : notes.trim() })
            }
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            إغلاق الصندوق
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

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-ink-soft)]">{label}</span>
      <span className="tabular">{value}</span>
    </div>
  );
}
