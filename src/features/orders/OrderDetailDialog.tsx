import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, CreditCard, Printer, Trash2, Banknote } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ordersApi } from "@/api/orders";
import { paymentsApi } from "@/api/payments";
import { CashPaymentDialog } from "@/features/payments/CashPaymentDialog";
import { createIdempotencyKeeper } from "@/lib/idempotency";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import { usePrintInvoice } from "@/hooks/usePrintInvoice";
import type { OrderStatus, Payment, PaymentMethod } from "@/types/models";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  preparing: "قيد التحضير",
  ready: "جاهز",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const STATUS_BADGE: Record<OrderStatus, "neutral" | "warning" | "info" | "success" | "danger"> = {
  pending: "neutral",
  preparing: "warning",
  ready: "info",
  completed: "success",
  cancelled: "danger",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  dine_in: "صالة",
  takeaway: "استلام",
  delivery: "توصيل",
};

const NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "preparing", label: "ابدأ التحضير" },
  preparing: { to: "ready", label: "جاهز للتقديم" },
  ready: { to: "completed", label: "إكمال الطلب" },
};

export function OrderDetailDialog({
  open,
  onOpenChange,
  orderId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
}) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("orders.manage");
  const canPrint = hasPermission("invoices.print");
  const canDeleteOrder = hasPermission("orders.delete");
  const canManagePayments = hasPermission("payments.manage");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
 
  const [cashRequest, setCashRequest] = useState<{ amount: number } | null>(null);
  
  const payKeeper = useRef(createIdempotencyKeeper()).current;

  const { data: order, isLoading } = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => ordersApi.get(orderId!),
    enabled: open && !!orderId,
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => ordersApi.updateStatus(orderId!, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setConfirmCancel(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const paymentMutation = useMutation({
    mutationFn: (payload: { method: PaymentMethod; amount: number; tendered?: number }) => {
      const body = {
        order_id: orderId!,
        method: payload.method,
        amount: payload.amount,
        ...(payload.tendered !== undefined ? { tendered_amount: payload.tendered } : {}),
      };
      return paymentsApi.create(body, payKeeper.keyFor(body));
    },
    onSuccess: (payment) => {
      payKeeper.reset();
      const change = Number(payment.change_amount ?? 0);
      toast.success(change > 0 ? `تم تسجيل الدفعة — الباقي للزبون ${formatCurrency(change)}` : "تم تسجيل الدفعة");
      setPaymentAmount("");
      setCashRequest(null);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const printMutation = usePrintInvoice();

  const deletePaymentMutation = useMutation({
    mutationFn: (id: number) => paymentsApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الدفعة");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setDeletingPayment(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: () => ordersApi.remove(orderId!),
    onSuccess: () => {
      toast.success("تم حذف الطلب");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setConfirmDeleteOrder(false);
      onOpenChange(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const totalPaid = order?.payments?.filter((p) => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const remaining = order ? Math.max(Number(order.total) - totalPaid, 0) : 0;
 
  const amountToPay = paymentAmount !== "" ? Number(paymentAmount) : Number(remaining.toFixed(2));

  
  function requestPayment(method: PaymentMethod, amount: number) {
    if (method === "cash") setCashRequest({ amount });
    else paymentMutation.mutate({ method, amount });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="tabular">{order ? order.order_number : "تفاصيل الطلب"}</DialogTitle>
          <DialogDescription>
            {order ? `${ORDER_TYPE_LABELS[order.order_type]} — ${formatDateTime(order.created_at)}` : ""}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-wine-400)]" />
          </div>
        )}

        {order && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABELS[order.status]}</Badge>
              <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                {order.payment_status === "paid" ? "مدفوع" : order.payment_status === "partial" ? "دفع جزئي" : "غير مدفوع"}
              </Badge>
              {order.table && <Badge variant="neutral">طاولة {order.table.table_number}</Badge>}
              {order.customer && <Badge variant="gold">{order.customer.name}</Badge>}
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-line)]">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-4 py-2.5 text-sm last:border-0"
                >
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">
                      {item.quantity}× {item.menu_item?.name ?? `صنف #${item.menu_item_id}`}
                    </p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {item.modifiers.map((m) => m.name).join("، ")}
                      </p>
                    )}
                    {item.notes && <p className="text-xs text-[var(--color-ink-soft)]">ملاحظة: {item.notes}</p>}
                  </div>
                  <span className="tabular">{formatCurrency(Number(item.unit_price) * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-wine-50)] px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-soft)]">المجموع الفرعي</span>
                <span className="tabular">{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-[var(--color-success)]">
                  <span>الخصم</span>
                  <span className="tabular">-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[var(--color-ink-soft)]">الضريبة</span>
                <span className="tabular">{formatCurrency(order.tax)}</span>
              </div>
              {order.delivery_fee && Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-ink-soft)]">رسوم التوصيل</span>
                  <span className="tabular">{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--color-line)] pt-1 text-base font-semibold">
                <span>الإجمالي</span>
                <span className="tabular">{formatCurrency(order.total)}</span>
              </div>
            </div>

            {canManage && order.status !== "completed" && order.status !== "cancelled" && (
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUS[order.status] && !(order.order_type === "delivery" && order.status === "ready") && (
                  <Button
                    size="sm"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate(NEXT_STATUS[order.status]!.to)}
                  >
                    {statusMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {NEXT_STATUS[order.status]!.label}
                  </Button>
                )}
                {order.order_type === "delivery" && order.status === "ready" && (
                  <p className="self-center text-xs text-[var(--color-ink-soft)]">
                    طلب التوصيل بيتسكّر من صفحة التوصيل (تعيين سائق ثم تسليم)
                  </p>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  disabled={statusMutation.isPending}
                  onClick={() => setConfirmCancel(true)}
                >
                  إلغاء الطلب
                </Button>
              </div>
            )}

            {canManage && remaining > 0 && order.status !== "cancelled" && (
              <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] p-3">
                <Label className="flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" /> تسجيل دفعة (المتبقي: {formatCurrency(remaining)})
                </Label>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="gold"
                    disabled={paymentMutation.isPending}
                    onClick={() => requestPayment("cash", Number(remaining.toFixed(2)))}
                  >
                    <Banknote className="h-4 w-4" />
                    دفع المتبقي نقدًا
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={paymentMutation.isPending}
                    onClick={() => requestPayment("card", Number(remaining.toFixed(2)))}
                  >
                    <CreditCard className="h-4 w-4" />
                    دفع المتبقي بالبطاقة
                  </Button>
                </div>

                <p className="text-xs text-[var(--color-ink-soft)]">أو دفعة جزئية / بطريقة ثانية:</p>
                <div className="flex gap-2">
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدًا</SelectItem>
                      <SelectItem value="card">بطاقة</SelectItem>
                      <SelectItem value="online">إلكتروني</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={remaining.toFixed(2)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    disabled={paymentMutation.isPending || !(amountToPay > 0)}
                    onClick={() => requestPayment(paymentMethod, amountToPay)}
                  >
                    {paymentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    تسجيل
                  </Button>
                </div>
              </div>
            )}

            {order.payments && order.payments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label>الدفعات المسجّلة</Label>
                {order.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm text-[var(--color-ink-soft)]">
                    <span className="flex flex-col">
                      <span>{p.method === "cash" ? "نقدًا" : p.method === "card" ? "بطاقة" : "إلكتروني"}</span>
                      {p.method === "cash" && Number(p.change_amount ?? 0) > 0 && (
                        <span className="tabular text-xs">
                          مقبوض {formatCurrency(p.tendered_amount ?? 0)} — باقي {formatCurrency(p.change_amount ?? 0)}
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="tabular">{formatCurrency(p.amount)}</span>
                      {canManagePayments && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="حذف الدفعة"
                          onClick={() => setDeletingPayment(p)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
                        </Button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(canPrint || canDeleteOrder) && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] pt-3">
                {canPrint && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={printMutation.isPending}
                    onClick={() => printMutation.mutate(order.id)}
                  >
                    {printMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    طباعة الفاتورة
                  </Button>
                )}
                {canDeleteOrder && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mr-auto text-[var(--color-danger)]"
                    onClick={() => setConfirmDeleteOrder(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    حذف الطلب
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <CashPaymentDialog
        open={!!cashRequest}
        onOpenChange={(o) => !o && setCashRequest(null)}
        amount={cashRequest?.amount ?? 0}
        description={order ? `الطلب ${order.order_number}` : undefined}
        pending={paymentMutation.isPending}
        onConfirm={(tendered) =>
          cashRequest && paymentMutation.mutate({ method: "cash", amount: cashRequest.amount, tendered })
        }
      />
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="إلغاء هاد الطلب؟"
        description="رح يرجع المخزون ونقاط الولاء. ما بينلغى طلب إله دفعات مسجّلة (احذف الدفعة أو استخدم الاسترجاع)."
        confirmLabel="نعم، إلغاء الطلب"
        cancelLabel="رجوع"
        loading={statusMutation.isPending}
        onConfirm={() => statusMutation.mutate("cancelled")}
      />
      <ConfirmDialog
        open={!!deletingPayment}
        onOpenChange={(o) => !o && setDeletingPayment(null)}
        title="حذف هاي الدفعة؟"
        description={deletingPayment ? `${formatCurrency(deletingPayment.amount)} — بترجع حالة الدفع للطلب تلقائيًا.` : undefined}
        confirmLabel="حذف"
        loading={deletePaymentMutation.isPending}
        onConfirm={() => deletingPayment && deletePaymentMutation.mutate(deletingPayment.id)}
      />
      <ConfirmDialog
        open={confirmDeleteOrder}
        onOpenChange={setConfirmDeleteOrder}
        title="حذف الطلب نهائيًا؟"
        description="هاد الإجراء ما بينرجع، وما بينحذف طلب إله دفعات أو استرجاعات."
        confirmLabel="حذف"
        loading={deleteOrderMutation.isPending}
        onConfirm={() => deleteOrderMutation.mutate()}
      />
    </Dialog>
  );
}
