import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChefHat, Clock3, PackageCheck, Volume2, VolumeX } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { useNewOrderAlert } from "@/hooks/useNewOrderAlert";
import { kitchenApi } from "@/api/kitchen";
import { getApiErrorMessage } from "@/api/client";
import type { Order } from "@/types/models";
import { KitchenOrderCard } from "./KitchenOrderCard";

const COLUMNS: { status: Order["status"]; title: string; icon: typeof Clock3 }[] = [
  { status: "pending", title: "قيد الانتظار", icon: Clock3 },
  { status: "preparing", title: "قيد التحضير", icon: ChefHat },
  { status: "ready", title: "جاهز", icon: PackageCheck },
];

export default function KitchenPage() {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["kitchen", "queue"],
    queryFn: kitchenApi.queue,

    refetchInterval: 8000,
  });

  const pendingIds = orders?.filter((o) => o.status === "pending").map((o) => o.id);
  const { enabled: soundOn, toggle: toggleSound } = useNewOrderAlert(pendingIds);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["kitchen", "queue"] });

  const startMutation = useMutation({
    mutationFn: kitchenApi.start,
    onSuccess: invalidate,
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
  const readyMutation = useMutation({
    mutationFn: kitchenApi.ready,
    onSuccess: invalidate,
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
  const serveMutation = useMutation({
    mutationFn: kitchenApi.serve,
    onSuccess: () => {
      toast.success("تم تسليم الطلب");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const busy = startMutation.isPending || readyMutation.isPending || serveMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="شاشة المطبخ"
        description="متابعة الطلبات وتحديث مراحل التحضير لحظيًا"
        action={
          <Button variant="outline" size="sm" onClick={toggleSound} title="تنبيه صوتي عند وصول طلب جديد">
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundOn ? "الصوت مفعّل" : "الصوت متوقف"}
          </Button>
        }
      />

      {isLoading && <p className="py-10 text-center text-sm text-[var(--color-ink-soft)]">جارِ التحميل...</p>}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const columnOrders = orders?.filter((o) => o.status === col.status) ?? [];
            const Icon = col.icon;
            return (
              <div key={col.status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-wine-50)] px-3 py-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-wine-700)]">
                    <Icon className="h-4 w-4" />
                    {col.title}
                  </div>
                  <span className="tabular rounded-full bg-white px-2 py-0.5 text-xs font-medium text-[var(--color-wine-700)]">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnOrders.length === 0 && (
                    <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] py-8 text-center text-sm text-[var(--color-ink-soft)]">
                      ما في طلبات هون حاليًا
                    </p>
                  )}
                  {columnOrders.map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      onStart={(id) => startMutation.mutate(id)}
                      onReady={(id) => readyMutation.mutate(id)}
                      onServe={(id) => serveMutation.mutate(id)}
                      loading={busy}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
