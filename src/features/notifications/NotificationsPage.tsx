import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Bell, Boxes, CalendarClock, Check, CheckCheck, ChevronLeft, Clock, Landmark, Ticket, Trash2, Undo2 } from "lucide-react";
import type { ComponentType } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notificationsApi, type AppNotification } from "@/api/notifications";
import { getApiErrorMessage } from "@/api/client";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";


const TYPE_META: Record<string, { label: string; to?: string; icon: ComponentType<{ className?: string }> }> = {
  order_status: { label: "الطلبات", to: "/orders", icon: Ticket },
  low_stock: { label: "المخزون", to: "/inventory", icon: Boxes },
  reservation: { label: "الحجوزات", to: "/reservations", icon: CalendarClock },
  refund_request: { label: "الاسترجاعات", to: "/refunds", icon: Undo2 },
  refund_status: { label: "الاسترجاعات", to: "/refunds", icon: Undo2 },
  shift: { label: "الورديات", to: "/workforce", icon: Clock },
  drawer: { label: "الصندوق", to: "/cash-drawer", icon: Landmark },
};

function metaOf(type: string) {
  return TYPE_META[type] ?? { label: "عام", icon: Bell };
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", unreadOnly],
    queryFn: () => notificationsApi.list(unreadOnly ? { is_read: false } : undefined),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const readMutation = useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: invalidate,
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const readAllMutation = useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: () => {
      toast.success("تم تعليم كل الإشعارات كمقروءة");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: notificationsApi.remove,
    onSuccess: invalidate,
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });


  const availableTypes = useMemo(() => {
    const labels = new Map<string, string>();
    for (const n of notifications ?? []) labels.set(metaOf(n.type).label, metaOf(n.type).label);
    return [...labels.keys()];
  }, [notifications]);

  const visible = useMemo(
    () => (notifications ?? []).filter((n) => typeFilter === "all" || metaOf(n.type).label === typeFilter),
    [notifications, typeFilter]
  );

  function open(n: AppNotification) {
    const target = metaOf(n.type).to;
    if (!n.is_read) readMutation.mutate(n.id);
    if (target) navigate(target);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الإشعارات"
        description="آخر التنبيهات المتعلقة بالطلبات والحجوزات والمخزون"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant={unreadOnly ? "default" : "outline"} size="sm" onClick={() => setUnreadOnly((v) => !v)}>
              {unreadOnly ? "عرض الكل" : "غير المقروءة فقط"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => readAllMutation.mutate()} disabled={readAllMutation.isPending}>
              <CheckCheck className="h-3.5 w-3.5" />
              تعليم الكل كمقروء
            </Button>
          </div>
        }
      />

      {availableTypes.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {["all", ...availableTypes].map((t) => (
            <Button key={t} size="sm" variant={typeFilter === t ? "default" : "outline"} onClick={() => setTypeFilter(t)}>
              {t === "all" ? "الكل" : t}
            </Button>
          ))}
        </div>
      )}

      {isLoading && <p className="text-sm text-[var(--color-ink-soft)]">جارِ التحميل...</p>}
      {!isLoading && visible.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-[var(--color-ink-soft)]">
          <Bell className="h-8 w-8 text-[var(--color-wine-300)]" />
          ما في إشعارات حاليًا
        </div>
      )}

      <div className="flex flex-col gap-2">
        {visible.map((n) => {
          const meta = metaOf(n.type);
          const Icon = meta.icon;
          return (
            <Card
              key={n.id}
              className={cn(
                "flex items-start justify-between gap-4 p-4",
                !n.is_read && "border-[var(--color-gold-500)]/50 bg-[var(--color-gold-100)]/40"
              )}
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-wine-50)] text-[var(--color-wine-600)]">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[var(--color-ink)]">{n.title}</p>
                    {!n.is_read && <Badge variant="gold">جديد</Badge>}
                    <Badge variant="neutral">{meta.label}</Badge>
                  </div>
                  <p className="text-sm text-[var(--color-ink-soft)]">{n.message}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {meta.to && (
                  <Button variant="ghost" size="sm" onClick={() => open(n)} title="فتح الصفحة المرتبطة">
                    فتح
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                )}
                {!n.is_read && (
                  <Button variant="ghost" size="icon" title="تعليم كمقروء" onClick={() => readMutation.mutate(n.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" title="حذف" onClick={() => removeMutation.mutate(n.id)}>
                  <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
