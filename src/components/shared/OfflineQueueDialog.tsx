import { useState } from "react";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { shortRef, type QueuedOrder } from "@/lib/offlineQueue";
import { useOfflineQueue } from "@/stores/offlineQueueStore";

const METHOD_LABEL = { cash: "دفع نقدي", card: "بطاقة", online: "دفع إلكتروني" } as const;


export function OfflineQueueDialog({
  open,
  onOpenChange,
  entries,
  onRetry,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: QueuedOrder[];

  onRetry: () => void;
}) {
  const retry = useOfflineQueue((s) => s.retry);
  const discard = useOfflineQueue((s) => s.discard);
  const syncing = useOfflineQueue((s) => s.syncing);
  const [deleting, setDeleting] = useState<QueuedOrder | null>(null);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>طلبات محفوظة على الجهاز</DialogTitle>
            <DialogDescription>
              هالطلبات انحفظت لأن السيرفر ما كان واصل. بتنبعت تلقائياً، والمرفوضة منها بتحتاج قرارك.
            </DialogDescription>
          </DialogHeader>

          <div className="flex max-h-96 flex-col gap-3 overflow-y-auto">
            {entries.length === 0 && <p className="py-6 text-center text-sm text-[var(--color-ink-soft)]">ما في طلبات معلّقة</p>}
            {entries.map((e) => (
              <div key={e.id} className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="tabular font-semibold">{e.orderNumber ?? `مؤقت ${shortRef(e.id)}`}</span>
                    <Badge variant={e.status === "failed" ? "danger" : "warning"}>
                      {e.status === "failed" ? "رفضه السيرفر" : "بانتظار الإرسال"}
                    </Badge>
                    {e.payment && <Badge variant="info">{METHOD_LABEL[e.payment.method]}</Badge>}
                  </div>
                  <span className="text-xs text-[var(--color-ink-soft)]">{formatDateTime(e.createdAt)}</span>
                </div>

                <p className="text-[var(--color-ink-soft)]">
                  {e.itemCount} صنف
                  {e.orderTotal !== undefined ? (
                    <> · الإجمالي {formatCurrency(e.orderTotal)}</>
                  ) : (
                    <> · تقريباً {formatCurrency(e.estimatedSubtotal)} (قبل الضريبة والخصم)</>
                  )}
                </p>

                {e.orderId !== undefined && (
                  <p className="text-xs text-[var(--color-success)]">الطلب انسجّل بالسيرفر{e.payment && !e.paymentDone ? "، والدفعة لسا ما انسجّلت" : ""}</p>
                )}
                {e.lastError && <p className="text-xs text-[var(--color-danger)]">{e.lastError}</p>}

                <div className="flex gap-2">
                  {e.status === "failed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncing}
                      onClick={() => {
                        retry(e.id);
                        onRetry();
                      }}
                    >
                      {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      إعادة المحاولة
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-[var(--color-danger)]" onClick={() => setDeleting(e)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    حذف من الجهاز
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="حذف الطلب من الجهاز؟"
        description={
          deleting?.orderId !== undefined
            ? "الطلب مسجّل أصلاً بالسيرفر. الحذف بيشيل بس محاولة الدفع المعلّقة من هالجهاز، فسجّل الدفعة يدوياً من صفحة الطلبات إذا لازم."
            : "الطلب ما وصل للسيرفر ولا للمطبخ، وبالحذف بيضيع نهائياً. تأكد إنك ما عاد بدك ياه أو سجّلته بطريقة تانية."
        }
        confirmLabel="حذف"
        loading={false}
        onConfirm={() => {
          if (deleting) discard(deleting.id);
          setDeleting(null);
        }}
      />
    </>
  );
}
