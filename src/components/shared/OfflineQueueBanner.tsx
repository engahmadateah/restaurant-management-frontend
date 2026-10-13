import { useState } from "react";
import { CloudOff, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { useOfflineQueue } from "@/stores/offlineQueueStore";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { OfflineQueueDialog } from "./OfflineQueueDialog";


export function OfflineQueueBanner({ onSyncNow }: { onSyncNow: () => void }) {
  const userId = useAuthStore((s) => s.user?.id);
  const entries = useOfflineQueue((s) => s.entries);
  const syncing = useOfflineQueue((s) => s.syncing);
  const lastStop = useOfflineQueue((s) => s.lastStop);
  const online = useOnlineStatus();
  const [open, setOpen] = useState(false);

  const mine = entries.filter((e) => e.userId === userId);
  const pending = mine.filter((e) => e.status === "pending").length;
  const failed = mine.filter((e) => e.status === "failed").length;

  if (online && pending === 0 && failed === 0 && !open) return null;

  const danger = failed > 0;
  const tone = danger
    ? "border-[var(--color-danger)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
    : "border-[var(--color-warning)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]";

  let text: string;
  if (pending > 0 || failed > 0) {
    const parts: string[] = [];
    if (pending > 0) parts.push(`${pending} طلب محفوظ على الجهاز بانتظار الإرسال`);
    if (failed > 0) parts.push(`${failed} طلب رفضه السيرفر`);
    text = parts.join(" · ");
    if (pending > 0 && !syncing && (lastStop === "offline" || !online)) text += " (السيرفر غير متاح حالياً)";
  } else {
    text = "لا يوجد اتصال بالإنترنت — الطلبات الجديدة من الكاشير بتنحفظ على الجهاز وبتنبعت لما يرجع الاتصال.";
  }

  return (
    <>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2 text-sm ${tone}`} role="status">
        <span className="flex items-center gap-2">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudOff className="h-4 w-4" />}
          {syncing ? "جارِ إرسال الطلبات المحفوظة..." : text}
        </span>
        <span className="flex items-center gap-2">
          {pending > 0 && (
            <Button size="sm" variant="outline" disabled={syncing} onClick={onSyncNow}>
              <RefreshCw className="h-3.5 w-3.5" />
              إرسال الآن
            </Button>
          )}
          {(pending > 0 || failed > 0) && (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              {failed > 0 ? "مراجعة" : "تفاصيل"}
            </Button>
          )}
        </span>
      </div>
      <OfflineQueueDialog open={open} onOpenChange={setOpen} entries={mine} onRetry={onSyncNow} />
    </>
  );
}
