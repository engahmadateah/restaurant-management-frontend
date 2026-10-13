import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Eye, Search, Printer, Banknote, ChevronRight, ChevronLeft, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ordersApi, type OrderListSummary, type OrderPayload, type PaginatedOrders } from "@/api/orders";
import { paymentsApi } from "@/api/payments";
import { CashPaymentDialog } from "@/features/payments/CashPaymentDialog";
import { createIdempotencyKeeper } from "@/lib/idempotency";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { todayYmd } from "@/lib/download";
import { usePermissions } from "@/hooks/usePermissions";
import { usePrintInvoice } from "@/hooks/usePrintInvoice";
import type { Order, OrderSource, OrderStatus, OrderType, PaymentStatus } from "@/types/models";
import { isCustomerSource, SOURCE_LABELS } from "./orderSource";
import { OrderFormDialog } from "./OrderFormDialog";
import { OrderDetailDialog } from "./OrderDetailDialog";

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

const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "غير مدفوع",
  partial: "دفع جزئي",
  paid: "مدفوع",
  refunded: "مسترجع",
};

const PAYMENT_BADGE: Record<PaymentStatus, "neutral" | "warning" | "success" | "danger"> = {
  unpaid: "warning",
  partial: "warning",
  paid: "success",
  refunded: "neutral",
};

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "صالة",
  takeaway: "استلام",
  delivery: "توصيل",
};


const NEXT_STATUS: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "preparing", label: "ابدأ التحضير" },
  preparing: { to: "ready", label: "جاهز" },
  ready: { to: "completed", label: "إكمال" },
};

const PER_PAGE = 20;
const AUTO_REFRESH_MS = 15_000;

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("orders.manage");
  const canPrint = hasPermission("invoices.print");
  const canDelete = hasPermission("orders.delete");

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [todayOnly, setTodayOnly] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [payingOrder, setPayingOrder] = useState<Order | null>(null);
  
  const orderKeeper = useRef(createIdempotencyKeeper()).current;
  const payKeeper = useRef(createIdempotencyKeeper()).current;
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);

  
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);


  useEffect(() => setPage(1), [statusFilter, typeFilter, sourceFilter, paymentFilter, todayOnly, debouncedSearch]);

  
  const today = todayYmd();
  const params = {
    status: statusFilter === "all" ? undefined : (statusFilter as OrderStatus),
    order_type: typeFilter === "all" ? undefined : (typeFilter as OrderType),
    source: sourceFilter === "all" ? undefined : (sourceFilter as OrderSource),
    payment_status: paymentFilter === "all" ? undefined : (paymentFilter as PaymentStatus | "outstanding"),
    from: todayOnly ? today : undefined,
    to: todayOnly ? today : undefined,
    search: debouncedSearch || undefined,
    per_page: PER_PAGE,
    page,
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["orders", "list", params],
    queryFn: () => ordersApi.list(params),
    refetchInterval: autoRefresh ? AUTO_REFRESH_MS : false,
    placeholderData: (prev) => prev,
  });

  const paginated = data && !Array.isArray(data) ? (data as PaginatedOrders) : null;
  const orders: Order[] = Array.isArray(data) ? data : (data?.data ?? []);
  const summary: OrderListSummary = paginated?.summary ?? { counts: {}, revenue: 0, unpaid: 0 };
  const totalCount = paginated?.total ?? orders.length;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders"] });

  const createMutation = useMutation({
    mutationFn: (payload: OrderPayload) => ordersApi.create(payload, orderKeeper.keyFor(payload)),
    onSuccess: () => {
      orderKeeper.reset();
      toast.success("تم إنشاء الطلب");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الطلب");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const payMutation = useMutation({
    mutationFn: ({ order, tendered }: { order: Order; tendered: number }) => {
      const payload = { order_id: order.id, method: "cash" as const, amount: Number(order.total), tendered_amount: tendered };
      return paymentsApi.create(payload, payKeeper.keyFor(payload));
    },
    onSuccess: (payment) => {
      payKeeper.reset();
      const change = Number(payment.change_amount ?? 0);
      toast.success(change > 0 ? `تم تسجيل الدفعة النقدية — الباقي للزبون ${formatCurrency(change)}` : "تم تسجيل الدفعة النقدية");
      invalidate();
      setPayingOrder(null);
    },
    
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ordersApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الطلب");
      invalidate();
      setDeletingOrder(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const printMutation = usePrintInvoice();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الطلبات"
        description="متابعة وإدارة كل طلبات المطعم"
        action={
          canManage && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              طلب جديد
            </Button>
          )
        }
      />

      {totalCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1 text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)]">
            {totalCount} طلب · <span className="tabular">{formatCurrency(summary.revenue)}</span>
          </span>
          {(Object.keys(STATUS_LABELS) as OrderStatus[])
            .filter((st) => summary.counts[st])
            .map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(statusFilter === st ? "all" : st)}
                title="اضغط للفلترة"
              >
                <Badge variant={STATUS_BADGE[st]} className={statusFilter === st ? "ring-2 ring-[var(--color-gold-500)]" : ""}>
                  {STATUS_LABELS[st]} {summary.counts[st]}
                </Badge>
              </button>
            ))}
          {summary.unpaid > 0 && (
            <button type="button" onClick={() => setPaymentFilter(paymentFilter === "outstanding" ? "all" : "outstanding")}>
              <Badge variant="warning">غير مكتمل الدفع {summary.unpaid}</Badge>
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <Input
            placeholder="رقم الطلب، الزبون، الهاتف، الطاولة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>

        <div className="flex overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-white text-sm">
          {[
            { value: true, label: "اليوم" },
            { value: false, label: "الكل" },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setTodayOnly(opt.value)}
              className={`px-3.5 py-2 transition-colors ${
                todayOnly === opt.value
                  ? "bg-[var(--color-wine-600)] font-medium text-white"
                  : "text-[var(--color-ink)] hover:bg-[var(--color-wine-50)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {Object.entries(ORDER_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger aria-label="مصدر الطلب">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المصادر</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40">
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل حالات الدفع</SelectItem>
              <SelectItem value="outstanding">غير مكتمل الدفع</SelectItem>
              <SelectItem value="unpaid">غير مدفوع</SelectItem>
              <SelectItem value="partial">دفع جزئي</SelectItem>
              <SelectItem value="paid">مدفوع</SelectItem>
              <SelectItem value="refunded">مسترجع</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mr-auto flex items-center gap-2">
          <Button
            variant={autoRefresh ? "outline" : "ghost"}
            size="sm"
            onClick={() => setAutoRefresh((v) => !v)}
            title="تحديث تلقائي كل ١٥ ثانية"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh && isFetching ? "animate-spin" : ""}`} />
            {autoRefresh ? "تحديث تلقائي" : "التحديث متوقف"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            تحديث الآن
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>رقم الطلب</TableHead>
            <TableHead>النوع</TableHead>
            <TableHead>الزبون</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>الدفع</TableHead>
            <TableHead>الإجمالي</TableHead>
            <TableHead>الوقت</TableHead>
            <TableHead className="text-left">إجراءات سريعة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={8}>جارِ التحميل...</TableEmpty>}
          {!isLoading && orders.length === 0 && <TableEmpty colSpan={8}>ما في طلبات مطابقة للفلاتر</TableEmpty>}
          {orders.map((order) => {
          
            const deliveryFlow = order.order_type === "delivery" && order.status === "ready";
            const next = deliveryFlow ? undefined : NEXT_STATUS[order.status];
            const open = order.status !== "completed" && order.status !== "cancelled";
            const canQuickPay = canManage && order.payment_status === "unpaid" && order.status !== "cancelled";
            return (
              <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrderId(order.id)}>
                <TableCell className="tabular font-medium">
                  {order.order_number}
                  {isCustomerSource(order.source) && order.source && (
                    <Badge variant="gold" className="mr-2">
                      {SOURCE_LABELS[order.source]}
                    </Badge>
                  )}
                  {order.table && (
                    <span className="mr-2 text-xs text-[var(--color-ink-soft)]">طاولة {order.table.table_number}</span>
                  )}
                </TableCell>
                <TableCell>{ORDER_TYPE_LABELS[order.order_type]}</TableCell>
                <TableCell className="text-[var(--color-ink-soft)]">{order.customer?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={PAYMENT_BADGE[order.payment_status]}>{PAYMENT_LABELS[order.payment_status]}</Badge>
                </TableCell>
                <TableCell className="tabular">{formatCurrency(order.total)}</TableCell>
                <TableCell className="text-[var(--color-ink-soft)]">{formatDateTime(order.created_at)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {canManage && open && next && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: order.id, status: next.to })}
                      >
                        {next.label}
                      </Button>
                    )}
                    {canManage && open && deliveryFlow && (
                      <span className="text-xs text-[var(--color-ink-soft)]">يتسكّر من صفحة التوصيل</span>
                    )}
                    {canQuickPay && (
                      <Button size="sm" variant="gold" onClick={() => setPayingOrder(order)} title="دفع كامل المبلغ نقدًا">
                        <Banknote className="h-3.5 w-3.5" />
                        دفع نقدي
                      </Button>
                    )}
                    {canPrint && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="طباعة الفاتورة"
                        disabled={printMutation.isPending}
                        onClick={() => printMutation.mutate(order.id)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="التفاصيل" onClick={() => setSelectedOrderId(order.id)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canDelete && (
                      <Button variant="ghost" size="icon" title="حذف الطلب" onClick={() => setDeletingOrder(order)}>
                        <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {paginated && paginated.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--color-ink-soft)]">
          <span>
            صفحة {paginated.current_page} من {paginated.last_page} — {paginated.total} طلب
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= paginated.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <OrderFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
        submitting={createMutation.isPending}
      />

      <OrderDetailDialog
        open={!!selectedOrderId}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />

      <CashPaymentDialog
        open={!!payingOrder}
        onOpenChange={(open) => !open && setPayingOrder(null)}
        amount={payingOrder ? Number(payingOrder.total) : 0}
        description={payingOrder ? `الطلب ${payingOrder.order_number}` : undefined}
        pending={payMutation.isPending}
        onConfirm={(tendered) => payingOrder && payMutation.mutate({ order: payingOrder, tendered })}
      />

      <ConfirmDialog
        open={!!deletingOrder}
        onOpenChange={(open) => !open && setDeletingOrder(null)}
        title={`حذف الطلب ${deletingOrder?.order_number ?? ""}؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deletingOrder && deleteMutation.mutate(deletingOrder.id)}
      />
    </div>
  );
}
