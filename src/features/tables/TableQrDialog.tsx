import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, Loader2, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { tablesApi } from "@/api/tables";
import { getApiErrorMessage } from "@/api/client";
import { buildQr, qrSvgMarkup } from "@/lib/qr";
import { openPrintWindow, writeQrPrintWindow } from "@/lib/printQr";
import { getSetting, useSettingsStore } from "@/stores/settingsStore";
import type { RestaurantTable } from "@/types/models";


export const tableOrderUrl = (token: string) => `${window.location.origin}/t/${token}`;


export function TableQrDialog({ table, onOpenChange }: { table: RestaurantTable | null; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [confirmRotate, setConfirmRotate] = useState(false);
  const qrEnabled = useSettingsStore((s) => s.settings.qr_ordering_enabled);
  const settingsLoaded = useSettingsStore((s) => s.loaded);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tables", "qr", table?.id],
    queryFn: () => tablesApi.qr(table!.id),
    enabled: !!table,
  });

  const rotate = useMutation({
    mutationFn: () => tablesApi.rotateQr(table!.id),
    onSuccess: (res) => {
      queryClient.setQueryData(["tables", "qr", table?.id], res);
      toast.success("انغيّر الرمز. الـ QR القديم ما عاد يشتغل، اطبع الجديد");
      setConfirmRotate(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const url = data ? tableOrderUrl(data.token) : null;
  const qr = useMemo(() => (url ? buildQr(url) : null), [url]);

  function print() {
    if (!url || !table) return;
    const w = openPrintWindow();
    if (!w) {
      toast.error("المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة وجرّب مرة تانية");
      return;
    }
    writeQrPrintWindow(w, [{ title: `طاولة ${table.table_number}`, subtitle: "امسح الكود لتطلب من الموبايل", url }], getSetting("restaurant_name", "المطعم"));
  }

  function download() {
    if (!url || !table) return;
    const blob = new Blob([qrSvgMarkup(url, 512)], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `qr-table-${table.table_number}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("تم نسخ الرابط");
    } catch {
      toast.error("تعذّر النسخ، انسخه يدوياً");
    }
  }

  return (
    <>
      <Dialog open={!!table} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR طاولة {table?.table_number}</DialogTitle>
            <DialogDescription>الزبون بيمسحه من موبايله وبيطلب مباشرة لهالطاولة.</DialogDescription>
          </DialogHeader>

          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          {isError && <p className="text-sm text-[var(--color-danger)]">تعذّر تحميل الرمز</p>}

          {qr && url && (
            <div className="flex flex-col items-center gap-3">
              <svg viewBox={qr.viewBox} className="h-56 w-56 rounded-[var(--radius-md)] border border-[var(--color-line)]" shapeRendering="crispEdges" role="img" aria-label={`QR طاولة ${table?.table_number}`}>
                <rect width="100%" height="100%" fill="#fff" />
                <path d={qr.path} fill="#000" />
              </svg>
              <p className="w-full break-all text-center text-xs text-[var(--color-ink-soft)]" dir="ltr">
                {url}
              </p>
            </div>
          )}

          {settingsLoaded && qrEnabled !== "1" && (
            <p className="rounded-[var(--radius-sm)] bg-[var(--color-warning-bg)] px-3 py-2 text-xs text-[var(--color-warning)]">
              الطلب من الطاولة مقفول حالياً. فعّله من الإعدادات، وإلا الزبون رح يشوف القائمة بدون زر طلب.
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" disabled={!url} onClick={print}>
              <Printer className="h-4 w-4" />
              طباعة
            </Button>
            <Button variant="outline" disabled={!url} onClick={download}>
              <Download className="h-4 w-4" />
              SVG
            </Button>
            <Button variant="outline" disabled={!url} onClick={() => void copy()}>
              <Copy className="h-4 w-4" />
              نسخ
            </Button>
          </div>
          <Button variant="ghost" className="text-[var(--color-danger)]" disabled={!data} onClick={() => setConfirmRotate(true)}>
            <RefreshCw className="h-4 w-4" />
            تغيير الرمز (لو انكشف الـ QR)
          </Button>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmRotate}
        onOpenChange={setConfirmRotate}
        title="تغيير رمز الطاولة؟"
        description="الـ QR المطبوع حالياً على هالطاولة رح يبطّل فوراً، ولازم تطبع الجديد وتبدّله."
        confirmLabel="غيّر الرمز"
        loading={rotate.isPending}
        onConfirm={() => rotate.mutate()}
      />
    </>
  );
}
