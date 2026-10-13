import { useEffect, useMemo, useState } from "react";
import { Banknote, Loader2 } from "lucide-react";
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
import { formatCurrency } from "@/lib/format";


const ROUND_STEPS = [1, 5, 10, 20, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

export function roundUpSuggestions(amountCents: number, max = 4): number[] {
  const out: number[] = [];
  for (const step of ROUND_STEPS) {
    const stepCents = step * 100;
    const value = Math.ceil(amountCents / stepCents) * stepCents;
    if (value > amountCents && !out.includes(value)) out.push(value);
    if (out.length >= max) break;
  }
  return out.map((c) => c / 100);
}

export function CashPaymentDialog({
  open,
  onOpenChange,
  amount,
  onConfirm,
  pending,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  amount: number;
  onConfirm: (tendered: number) => void;
  pending?: boolean;
  description?: string;
}) {
  const [received, setReceived] = useState("");

  useEffect(() => {
    if (open) setReceived("");
  }, [open]);

  const amountCents = Math.round(amount * 100);
  const receivedNum = received.trim() === "" ? amount : Number(received);
  const validNumber = Number.isFinite(receivedNum) && receivedNum >= 0;
  const receivedCents = validNumber ? Math.round(receivedNum * 100) : 0;
  const changeCents = receivedCents - amountCents;
  const insufficient = !validNumber || changeCents < 0;

  const suggestions = useMemo(() => roundUpSuggestions(amountCents), [amountCents]);

  function submit() {
    if (insufficient || pending) return;
    onConfirm(receivedCents / 100);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            دفع نقدي
          </DialogTitle>
          <DialogDescription>{description ?? "اكتب المبلغ يلي قبضته من الزبون وبيظهر الباقي"}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-wine-50)] px-4 py-3">
            <span className="text-sm text-[var(--color-ink-soft)]">المطلوب</span>
            <span className="tabular text-lg font-semibold">{formatCurrency(amount)}</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cash_received">المبلغ المقبوض</Label>
            <Input
              id="cash_received"
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              autoFocus
              placeholder={amount.toFixed(2)}
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setReceived(String(amount))}>
              المبلغ مضبوط
            </Button>
            {suggestions.map((s) => (
              <Button key={s} type="button" size="sm" variant="outline" onClick={() => setReceived(String(s))}>
                <span className="tabular">{formatCurrency(s)}</span>
              </Button>
            ))}
          </div>

          <div
            className={`flex items-center justify-between rounded-[var(--radius-md)] border px-4 py-3 ${
              insufficient
                ? "border-[var(--color-danger)] text-[var(--color-danger)]"
                : "border-[var(--color-line)] text-[var(--color-ink)]"
            }`}
            aria-live="polite"
          >
            <span className="text-sm">{insufficient ? "ناقص" : "الباقي للزبون"}</span>
            <span className="tabular text-xl font-bold">
              {validNumber ? formatCurrency(Math.abs(changeCents) / 100) : "—"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" disabled={insufficient || pending} onClick={submit}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            تأكيد الاستلام
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
