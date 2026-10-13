import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { useOfflineQueue } from "@/stores/offlineQueueStore";

const RETRY_INTERVAL_MS = 30_000;

/**
 * بيرسل طلبات الـ POS المحفوظة على الجهاز لما يرجع الاتصال. بيشتغل بكل صفحات الإدارة (AdminLayout):
 * عند الفتح، وعند حدث "online"، وكل 30 ثانية طالما في طلبات معلّقة، وعند رجوع التاب للواجهة.
 * الإرسال الفعلي والأمان من التكرار: lib/offlineQueue.ts + stores/offlineQueueStore.ts
 */
export function useOfflineSync() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);
  const token = useAuthStore((s) => s.token);

  const run = useCallback(async () => {
    if (!userId || !token) return;
    const { entries, sync } = useOfflineQueue.getState();
    if (!entries.some((e) => e.userId === userId && e.status === "pending")) return;

    const result = await sync(userId);
    if (!result) return;

    if (result.synced.length > 0) {
      toast.success(`تمت مزامنة ${result.synced.length} طلب`);
      for (const key of ["orders", "payments", "cash-drawer", "tables", "dashboard"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    }
    if (result.failed.length > 0) {
      toast.error(`${result.failed.length} طلب رفضه السيرفر — راجعهم من شريط الطابور أعلى الصفحة`);
    }
  }, [queryClient, userId, token]);

  useEffect(() => {
    void run();
    const onOnline = () => void run();
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    const timer = window.setInterval(() => void run(), RETRY_INTERVAL_MS);

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [run]);

  return run;
}
