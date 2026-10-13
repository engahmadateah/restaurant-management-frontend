import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePayslip } from "@/hooks/usePayslip";
import type { Payroll, PayrollStatus } from "@/types/models";

const STATUS_LABELS: Record<PayrollStatus, string> = { draft: "مسودة", approved: "معتمد", paid: "مدفوع" };
const STATUS_VARIANTS: Record<PayrollStatus, "neutral" | "info" | "success"> = {
  draft: "neutral",
  approved: "info",
  paid: "success",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--color-ink-soft)]">{label}</span>
      <span className="tabular font-medium text-[var(--color-ink)]">{value}</span>
    </div>
  );
}

export function PayrollDetailDialog({
  payroll,
  onOpenChange,
  canManage,
  onSaveDeductions,
  onApprove,
  onMarkPaid,
  saving,
  approving,
  markingPaid,
}: {
  payroll: Payroll | null;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  onSaveDeductions: (id: number, deductions: number, notes: string) => void;
  onApprove: (id: number) => void;
  onMarkPaid: (id: number) => void;
  saving: boolean;
  approving: boolean;
  markingPaid: boolean;
}) {
  const payslip = usePayslip();
  const [deductions, setDeductions] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (payroll) {
      setDeductions(payroll.deductions);
      setNotes(payroll.notes ?? "");
    }
  }, [payroll]);

  if (!payroll) return null;

  const isDraft = payroll.status === "draft";
  const editable = canManage && isDraft;

  return (
    <Dialog open={!!payroll} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>كشف راتب — {payroll.user?.name ?? "—"}</DialogTitle>
            <Badge variant={STATUS_VARIANTS[payroll.status]}>{STATUS_LABELS[payroll.status]}</Badge>
          </div>
          <DialogDescription>
            {formatDate(payroll.period_start)} إلى {formatDate(payroll.period_end)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Row label="إجمالي الساعات" value={`${payroll.total_hours} س`} />
          <Row label="ساعات عادية" value={`${payroll.regular_hours} س`} />
          <Row label="ساعات إضافية" value={`${payroll.overtime_hours} س`} />
          <Separator />
          <Row label="أجر الساعات العادية" value={formatCurrency(payroll.regular_pay)} />
          <Row label="أجر الساعات الإضافية" value={formatCurrency(payroll.overtime_pay)} />
          <Row label="الإجمالي قبل الاستقطاع" value={formatCurrency(payroll.gross_pay)} />
        </div>

        <Separator />

        {editable ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deductions">الاستقطاعات</Label>
              <Input
                id="deductions"
                type="number"
                step="0.01"
                min={0}
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p_notes">ملاحظات</Label>
              <Textarea id="p_notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        ) : (
          <Row label="الاستقطاعات" value={formatCurrency(payroll.deductions)} />
        )}

        <div className="rounded-[var(--radius-md)] bg-[var(--color-wine-50)] px-4 py-3">
          <Row
            label="الصافي المستحق"
            value={formatCurrency(
              editable
                ? Math.max(0, Number(payroll.gross_pay) - (Number(deductions) || 0))
                : payroll.net_pay
            )}
          />
        </div>

        <DialogFooter>
          {payroll.status !== "draft" && (
            <Button type="button" variant="outline" disabled={payslip.isPending} onClick={() => payslip.mutate(payroll.id)}>
              {payslip.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              كشف الراتب PDF
            </Button>
          )}
          {editable && (
            <Button
              type="button"
              disabled={saving}
              onClick={() => onSaveDeductions(payroll.id, Number(deductions) || 0, notes)}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              حفظ
            </Button>
          )}
          {canManage && payroll.status === "draft" && (
            <Button type="button" variant="outline" disabled={approving} onClick={() => onApprove(payroll.id)}>
              {approving && <Loader2 className="h-4 w-4 animate-spin" />}
              اعتماد
            </Button>
          )}
          {canManage && payroll.status === "approved" && (
            <Button type="button" variant="outline" disabled={markingPaid} onClick={() => onMarkPaid(payroll.id)}>
              {markingPaid && <Loader2 className="h-4 w-4 animate-spin" />}
              تأشير كمدفوع
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              إغلاق
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
