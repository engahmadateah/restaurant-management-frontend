import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ordersApi } from "@/api/orders";
import { paymentsApi } from "@/api/payments";
import { runSync, type FailureKind, type QueuedOrder, type SyncResult } from "@/lib/offlineQueue";
import type { PaymentMethod } from "@/types/models";

const STORAGE_KEY = "zeitoun-offline-queue";
const LOCK_NAME = "zeitoun-offline-sync";

interface OfflineQueueState {
  entries: QueuedOrder[];
  // الحالة التالية مؤقتة (مش بتنحفظ)
  syncing: boolean;
  lastStop: FailureKind | null;
  /** طلبات انتزامنت هالجلسة: بتخلّي بطاقة الـ POS تعرض رقم الطلب الحقيقي */
  synced: Record<string, { orderNumber: string; total: number; paid: boolean }>;

  enqueue: (entry: QueuedOrder) => boolean;
  setPayment: (id: string, method: PaymentMethod) => void;
  retry: (id: string) => void;
  discard: (id: string) => void;
  sync: (userId: number) => Promise<SyncResult | null>;
}

/** هل الإدخال انكتب فعلاً بالتخزين المحلي؟ (quota ممتلئ/وضع خاص = فشل صامت، وضياع طلب هو أسوأ نتيجة) */
function isPersisted(id: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return !!raw && (JSON.parse(raw)?.state?.entries ?? []).some((e: QueuedOrder) => e.id === id);
  } catch {
    return false;
  }
}

export const useOfflineQueue = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      entries: [],
      syncing: false,
      lastStop: null,
      synced: {},

      enqueue: (entry) => {
        try {
          set((s) => ({ entries: [...s.entries, entry] }));
          if (isPersisted(entry.id)) return true;
        } catch {
          // التخزين المحلي رفض الكتابة (ممتلئ/وضع خاص): نفس معالجة "ما انحفظ" تحت
        }
        // ما انحفظ: لا نخلّي الكاشير يظن إن الطلب مضمون
        try {
          set((s) => ({ entries: s.entries.filter((e) => e.id !== entry.id) }));
        } catch {
          // الحالة بالذاكرة اتحدّثت قبل فشل الكتابة، فما في شي إضافي نعمله
        }
        return false;
      },

      // مرة وحدة وقبل ما يبلّش إرسال الطلب (حتى مفتاح الدفعة يضل مطابق للمحتوى)
      setPayment: (id, method) =>
        set((s) => ({
          entries: s.entries.map((e) =>
            e.id === id && e.orderId === undefined && !e.payment ? { ...e, payment: { method } } : e
          ),
        })),

      retry: (id) =>
        set((s) => ({
          entries: s.entries.map((e) => (e.id === id ? { ...e, status: "pending", lastError: undefined } : e)),
        })),

      discard: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),

      sync: async (userId) => {
        if (get().syncing) return null;

        const run = async (): Promise<SyncResult> => {
          set({ syncing: true });
          try {
            const result = await runSync(
              userId,
              {
                all: () => get().entries,
                update: (id, patch) =>
                  set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
                remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
              },
              {
                createOrder: (payload, key) => ordersApi.create(payload, key),
                createPayment: (payload, key) => paymentsApi.create(payload, key),
              }
            );
            set((s) => ({
              lastStop: result.stoppedBy,
              synced: {
                ...s.synced,
                ...Object.fromEntries(
                  result.synced.map((e) => [
                    e.id,
                    { orderNumber: e.orderNumber ?? "", total: e.orderTotal ?? 0, paid: !!e.payment && (e.orderTotal ?? 0) > 0 },
                  ])
                ),
              },
            }));
            return result;
          } finally {
            set({ syncing: false });
          }
        };

        // أكتر من تاب مفتوح: قفل على مستوى المتصفح حتى ما يشتغلوا مرتين بنفس الوقت
        // (حتى بدون القفل التكرار مستحيل بفضل الـ Idempotency-Key، بس هيك أنظف)
        const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
        if (locks?.request) {
          return locks.request(LOCK_NAME, { ifAvailable: true }, (lock) => (lock ? run() : Promise.resolve(null)));
        }
        return run();
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (s) => ({ entries: s.entries }),
    }
  )
);

// تاب تاني غيّر الطابور: حدّث نسختنا
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) void useOfflineQueue.persist.rehydrate();
  });
}
