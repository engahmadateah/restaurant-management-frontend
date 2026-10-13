import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { Check, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { publicOrderingApi, type PublicOrder } from "@/api/publicOrdering";
import { readLastOrder } from "./publicUtils";

const POLL_MS = 8_000;

interface Step {
  label: string;
}

function stepsFor(order: PublicOrder): { steps: Step[]; current: number } {
  const base: Step[] = [{ label: "تم استلام طلبك" }, { label: "قيد التحضير" }];

  if (order.order_type === "delivery") {
    const steps = [...base, { label: "جاهز وبانتظار السائق" }, { label: "السائق بالطريق إليك" }, { label: "تم التوصيل" }];
    let current = { pending: 0, preparing: 1, ready: 2, completed: 4, cancelled: 0 }[order.status];
    if (order.status === "ready" && order.delivery_status === "out_for_delivery") current = 3;
    if (order.delivery_status === "delivered") current = 4;
    return { steps, current };
  }

  const steps = [
    ...base,
    { label: order.order_type === "takeaway" ? "جاهز للاستلام" : "جاهز" },
    { label: order.order_type === "takeaway" ? "تم التسليم" : "تم التقديم" },
  ];
  return { steps, current: { pending: 0, preparing: 1, ready: 2, completed: 3, cancelled: 0 }[order.status] };
}

export default function PublicTrackPage() {
  const { token = "" } = useParams();
  const info = useQuery({ queryKey: ["public", "info"], queryFn: publicOrderingApi.info, staleTime: 60_000 });
  const order = useQuery({
    queryKey: ["public", "order", token],
    queryFn: () => publicOrderingApi.track(token),
    refetchInterval: (q) => (q.state.data?.status === "completed" || q.state.data?.status === "cancelled" ? false : POLL_MS),
    retry: (count, err) => !(axios.isAxiosError(err) && err.response?.status === 404) && count < 2,
  });

  useEffect(() => {
    document.title = info.data?.restaurant_name ? `طلبك - ${info.data.restaurant_name}` : "تتبّع الطلب";
  }, [info.data?.restaurant_name]);

  const currency = info.data?.currency ?? "";
  const menuPath = readLastOrder()?.menuPath ?? "/order";

  if (order.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-wine-600)]" />
      </div>
    );
  }

  const notFound = axios.isAxiosError(order.error) && order.error.response?.status === 404;
  if (!order.data) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-lg font-semibold">{notFound ? "ما لقينا هالطلب" : "تعذّر تحميل حالة الطلب"}</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {notFound ? "تأكد من الرابط، أو اسأل الموظف." : "تأكد من الإنترنت وجرّب مرة تانية."}
        </p>
        {!notFound && <Button onClick={() => void order.refetch()}>إعادة المحاولة</Button>}
      </div>
    );
  }

  const o = order.data;
  const cancelled = o.status === "cancelled";
  const { steps, current } = stepsFor(o);
  const finished = o.status === "completed";

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex flex-col gap-1 text-center">
        <p className="text-sm text-[var(--color-ink-soft)]">{info.data?.restaurant_name}</p>
        <h1 className="text-xl font-bold">طلبك رقم <span className="tabular">{o.order_number}</span></h1>
        {o.table_number && <p className="text-sm text-[var(--color-ink-soft)]">طاولة {o.table_number}</p>}
      </header>

      <Card className="p-5">
        {cancelled ? (
          <div className="flex flex-col items-center gap-2 text-center">
            <XCircle className="h-10 w-10 text-[var(--color-danger)]" />
            <p className="font-semibold">تم إلغاء الطلب</p>
            <p className="text-sm text-[var(--color-ink-soft)]">إذا كان هالشي بالغلط، تواصل مع المطعم.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-4">
            {steps.map((step, i) => {
              const done = i < current || finished;
              const active = i === current && !finished;
              return (
                <li key={step.label} className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                      done
                        ? "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                        : active
                          ? "border-[var(--color-wine-600)] bg-[var(--color-wine-50)] text-[var(--color-wine-600)]"
                          : "border-[var(--color-line)] text-[var(--color-ink-soft)]"
                    }`}
                    aria-hidden
                  >
                    {done ? <Check className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
                  </span>
                  <span className={active ? "font-semibold" : done ? "" : "text-[var(--color-ink-soft)]"}>{step.label}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-5 text-sm">
        <ul className="flex flex-col divide-y divide-[var(--color-line)]">
          {o.items.map((it, idx) => (
            <li key={idx} className="flex justify-between gap-3 py-2">
              <div className="min-w-0">
                <p className="font-medium">
                  {it.quantity} × {it.name ?? "—"}
                </p>
                {it.modifiers.length > 0 && <p className="text-xs text-[var(--color-ink-soft)]">{it.modifiers.join("، ")}</p>}
                {it.notes && <p className="text-xs text-[var(--color-ink-soft)]">ملاحظة: {it.notes}</p>}
              </div>
              <span className="tabular shrink-0">{formatCurrency(it.price * it.quantity, currency)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-1 border-t border-[var(--color-line)] pt-3">
          <Row label="المجموع" value={formatCurrency(o.subtotal, currency)} />
          {o.discount > 0 && <Row label="الخصم" value={`− ${formatCurrency(o.discount, currency)}`} />}
          {o.tax > 0 && <Row label="الضريبة" value={formatCurrency(o.tax, currency)} />}
          {o.delivery_fee > 0 && <Row label="أجرة التوصيل" value={formatCurrency(o.delivery_fee, currency)} />}
          <div className="flex justify-between pt-1 text-base font-semibold">
            <dt>الإجمالي</dt>
            <dd className="tabular">{formatCurrency(o.total, currency)}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-ink-soft)]">الدفع</span>
          {o.payment_status === "paid" ? <Badge variant="success">مدفوع</Badge> : <Badge variant="warning">كاش عند الاستلام</Badge>}
        </div>
      </Card>

      <div className="flex gap-2">
        {!finished && !cancelled && (
          <Button variant="outline" className="flex-1" onClick={() => void order.refetch()} disabled={order.isFetching}>
            <RefreshCw className={`h-4 w-4 ${order.isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        )}
        <Button asChild variant="outline" className="flex-1">
          <Link to={menuPath}>اطلب المزيد</Link>
        </Button>
      </div>
      {order.isError && <p className="text-center text-xs text-[var(--color-warning)]">عم نحاول نحدّث الحالة... تأكد من الإنترنت</p>}
      {!finished && !cancelled && <p className="text-center text-xs text-[var(--color-ink-soft)]">بتتحدّث الحالة تلقائياً</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[var(--color-ink-soft)]">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}
