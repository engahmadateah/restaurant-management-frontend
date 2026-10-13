import { formatDistanceToNowStrict } from "date-fns";
import { ar } from "date-fns/locale";
import { Armchair, ChefHat, Clock, PackageCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Order, OrderType } from "@/types/models";
import { isCustomerSource, SOURCE_LABELS } from "@/features/orders/orderSource";

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "صالة",
  takeaway: "استلام",
  delivery: "توصيل",
};

interface KitchenOrderCardProps {
  order: Order;
  onStart: (id: number) => void;
  onReady: (id: number) => void;
  onServe: (id: number) => void;
  loading: boolean;
}

export function KitchenOrderCard({ order, onStart, onReady, onServe, loading }: KitchenOrderCardProps) {
 
  const stageStartedAt = order.status === "preparing" ? order.preparing_at : order.status === "ready" ? order.ready_at : order.created_at;
  const elapsed = stageStartedAt
    ? formatDistanceToNowStrict(new Date(stageStartedAt), { locale: ar, addSuffix: false })
    : "—";

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="tabular text-sm font-semibold text-[var(--color-ink)]">
            {order.order_number}
            {isCustomerSource(order.source) && order.source && (
              <Badge variant="gold" className="mr-2">
                {SOURCE_LABELS[order.source]}
              </Badge>
            )}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
            {order.order_type === "delivery" ? <Truck className="h-3.5 w-3.5" /> : <Armchair className="h-3.5 w-3.5" />}
            {ORDER_TYPE_LABELS[order.order_type]}
            {order.table && <span> — طاولة {order.table.table_number}</span>}
          </div>
        </div>
        <Badge variant="neutral">
          <Clock className="h-3 w-3" />
          {elapsed}
        </Badge>
      </div>

      <ul className="flex flex-col gap-1 text-sm text-[var(--color-ink)]">
        {order.items?.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2">
            <span>
              <span className="tabular font-medium">{item.quantity}×</span> {item.menu_item?.name ?? "صنف محذوف"}
            </span>
          </li>
        ))}
      </ul>

      {order.notes && (
        <p className="rounded-[var(--radius-sm)] bg-[var(--color-warning-bg)] px-2 py-1 text-xs text-[var(--color-warning)]">
          {order.notes}
        </p>
      )}

      <div className="mt-auto pt-1">
        {order.status === "pending" && (
          <Button className="w-full" onClick={() => onStart(order.id)} disabled={loading}>
            <ChefHat className="h-4 w-4" />
            ابدأ التحضير
          </Button>
        )}
        {order.status === "preparing" && (
          <Button className="w-full" variant="gold" onClick={() => onReady(order.id)} disabled={loading}>
            <PackageCheck className="h-4 w-4" />
            الطلب جاهز
          </Button>
        )}
        {order.status === "ready" && order.order_type !== "delivery" && (
          <Button className="w-full" variant="outline" onClick={() => onServe(order.id)} disabled={loading}>
            تسليم الطلب
          </Button>
        )}
        {order.status === "ready" && order.order_type === "delivery" && (
          <p className="text-center text-xs text-[var(--color-ink-soft)]">بانتظار تعيين سائق من صفحة التوصيل</p>
        )}
      </div>
    </Card>
  );
}
