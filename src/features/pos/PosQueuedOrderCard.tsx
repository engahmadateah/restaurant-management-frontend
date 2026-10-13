import { AlertTriangle, Banknote, CheckCircle2, CloudOff, CreditCard, Loader2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import { shortRef } from "@/lib/offlineQueue";
import { useOfflineQueue } from "@/stores/offlineQueueStore";

export function PosQueuedOrderCard({ entryId, onNewOrder }: { entryId: string; onNewOrder: () => void }) {
  const entry = useOfflineQueue((s) => s.entries.find((e) => e.id === entryId));
  const synced = useOfflineQueue((s) => s.synced[entryId]);
  const syncing = useOfflineQueue((s) => s.syncing);
  const setPayment = useOfflineQueue((s) => s.setPayment);

  const newOrderButton = (
    <Button onClick={onNewOrder} className="w-full">
      <RotateCcw className="h-4 w-4" />
      طلب جديد
    </Button>
  );

  if (!entry && synced) {
    return (
      <Card className="flex h-fit flex-col items-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-bg)]">
          <CheckCircle2 className="h-7 w-7 text-[var(--color-success)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">انرسل الطلب للسيرفر</h3>
          <p className="tabular text-sm text-[var(--color-ink-soft)]">{synced.orderNumber}</p>
        </div>
        <div className="flex w-full justify-between rounded-[var(--radius-sm)] bg-[var(--color-wine-50)] px-4 py-3 text-sm">
          <span className="text-[var(--color-ink-soft)]">الإجمالي</span>
          <span className="tabular font-semibold">{formatCurrency(synced.total)}</span>
        </div>
        {synced.paid && <Badge variant="success">تم الدفع</Badge>}
        {newOrderButton}
      </Card>
    );
  }

  if (!entry) {
    return (
      <Card className="flex h-fit flex-col items-center gap-4 p-6 text-center">
        <p className="text-sm text-[var(--color-ink-soft)]">الطلب انحذف من الجهاز.</p>
        {newOrderButton}
      </Card>
    );
  }

  if (entry.status === "failed") {
    return (
      <Card className="flex h-fit flex-col items-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-bg)]">
          <AlertTriangle className="h-7 w-7 text-[var(--color-danger)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">السيرفر رفض الطلب</h3>
          <p className="mt-1 text-sm text-[var(--color-danger)]">{entry.lastError}</p>
        </div>
        <p className="text-xs text-[var(--color-ink-soft)]">راجع الطلب من الشريط أعلى الصفحة (إعادة محاولة أو حذف).</p>
        {newOrderButton}
      </Card>
    );
  }

  const canChoosePayment = !entry.payment && entry.orderId === undefined;

  return (
    <Card className="flex h-fit flex-col items-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-warning-bg)]">
        {syncing ? (
          <Loader2 className="h-7 w-7 animate-spin text-[var(--color-warning)]" />
        ) : (
          <CloudOff className="h-7 w-7 text-[var(--color-warning)]" />
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold">الطلب محفوظ على الجهاز</h3>
        <p className="tabular text-sm text-[var(--color-ink-soft)]">مؤقت {shortRef(entry.id)}</p>
      </div>

      <div className="w-full rounded-[var(--radius-sm)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] px-4 py-3 text-start text-sm text-[var(--color-warning)]">
        ما وصل للسيرفر ولا للمطبخ بعد. بلّغ المطبخ بطريقة تانية. بينبعت تلقائياً لما يرجع الاتصال.
      </div>

      <div className="w-full rounded-[var(--radius-sm)] bg-[var(--color-wine-50)] px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-[var(--color-ink-soft)]">المجموع التقريبي</span>
          <span className="tabular font-semibold">{formatCurrency(entry.estimatedSubtotal)}</span>
        </div>
        <p className="mt-1 text-start text-xs text-[var(--color-ink-soft)]">قبل الضريبة والخصم. الإجمالي الحقيقي بيحسبه السيرفر.</p>
      </div>

      {entry.payment ? (
        <Badge variant="info">
          الدفع {entry.payment.method === "cash" ? "نقدي" : "بالبطاقة"} بينسجّل عند الإرسال
        </Badge>
      ) : (
        canChoosePayment && (
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full gap-2">
              <Button className="flex-1" variant="gold" onClick={() => setPayment(entry.id, "cash")}>
                <Banknote className="h-4 w-4" />
                دفع نقدي
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => setPayment(entry.id, "card")}>
                <CreditCard className="h-4 w-4" />
                بطاقة
              </Button>
            </div>
            <p className="text-start text-xs text-[var(--color-ink-soft)]">
              الدفعة بتنسجّل عند الإرسال بكامل إجمالي الطلب. المقبوض والباقي للزبون ما بينسجّلوا بدون اتصال.
            </p>
          </div>
        )
      )}

      {newOrderButton}
    </Card>
  );
}
