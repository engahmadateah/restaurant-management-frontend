import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Printer, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { paymentsApi, type PaymentListParams, type PaymentWithOrder } from "@/api/payments";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import { usePrintInvoice } from "@/hooks/usePrintInvoice";
import { StatBlock } from "@/features/reports/StatBlock";

const METHOD_LABELS: Record<string, string> = { cash: "نقدًا", card: "بطاقة", online: "إلكتروني" };
const STATUS_LABELS: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
  paid: { label: "مدفوعة", variant: "success" },
  pending: { label: "معلّقة", variant: "warning" },
  refunded: { label: "مسترجعة", variant: "danger" },
};

const PAGE_SIZE = 25;

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const canManage = usePermissions().hasPermission("payments.manage");
  const print = usePrintInvoice();

  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [day, setDay] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<PaymentWithOrder | null>(null);

 
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);


  const params: PaymentListParams = {
    method: method === "all" ? undefined : (method as PaymentListParams["method"]),
    status: status === "all" ? undefined : (status as PaymentListParams["status"]),
    from: day || undefined,
    to: day || undefined,
    search: debouncedSearch || undefined,
    page,
    per_page: PAGE_SIZE,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["payments", "page", params],
    queryFn: () => paymentsApi.page(params),
    placeholderData: keepPreviousData,
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => paymentsApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الدفعة");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });


  const totals = {
    all: Number(data?.summary.paid_total ?? 0),
    cash: Number(data?.summary.cash_total ?? 0),
    card: Number(data?.summary.card_total ?? 0),
    online: Number(data?.summary.online_total ?? 0),
  };

  const rows: PaymentWithOrder[] = data?.data ?? [];
  const pageCount = Math.max(1, data?.last_page ?? 1);
  const current = Math.min(page, pageCount);

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الدفعات" description="سجل كل الدفعات المسجّلة على الطلبات" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatBlock label="إجمالي المقبوض" value={formatCurrency(totals.all)} />
        <StatBlock label="نقدًا" value={formatCurrency(totals.cash)} />
        <StatBlock label="بطاقة" value={formatCurrency(totals.card)} />
        <StatBlock label="إلكتروني" value={formatCurrency(totals.online)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="رقم الطلب..."
            className="pr-9"
          />
        </div>
        <Select value={method} onValueChange={resetPage(setMethod)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الطرق</SelectItem>
            <SelectItem value="cash">نقدًا</SelectItem>
            <SelectItem value="card">بطاقة</SelectItem>
            <SelectItem value="online">إلكتروني</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={resetPage(setStatus)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="paid">مدفوعة</SelectItem>
            <SelectItem value="pending">معلّقة</SelectItem>
            <SelectItem value="refunded">مسترجعة</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={day} onChange={(e) => resetPage(setDay)(e.target.value)} className="w-44" />
        {(search || method !== "all" || status !== "all" || day) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setDebouncedSearch("");
              setMethod("all");
              setStatus("all");
              setDay("");
              setPage(1);
            }}
          >
            مسح الفلاتر
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الطلب</TableHead>
              <TableHead>الطريقة</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableEmpty colSpan={6}>جارِ التحميل...</TableEmpty>}
            {!isLoading && !isFetching && rows.length === 0 && <TableEmpty colSpan={6}>ما في دفعات مطابقة</TableEmpty>}
            {rows.map((p) => {
              const st = STATUS_LABELS[p.status] ?? { label: p.status, variant: "warning" as const };
              return (
                <TableRow key={p.id}>
                  <TableCell className="tabular font-medium">#{p.order?.order_number ?? p.order_id}</TableCell>
                  <TableCell>{METHOD_LABELS[p.method] ?? p.method}</TableCell>
                  <TableCell className="tabular">
                    {formatCurrency(p.amount)}
                    {p.method === "cash" && Number(p.change_amount ?? 0) > 0 && (
                      <span className="block text-xs text-[var(--color-ink-soft)]">
                        مقبوض {formatCurrency(p.tendered_amount ?? 0)} — باقي {formatCurrency(p.change_amount ?? 0)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="text-[var(--color-ink-soft)]">{formatDateTime(p.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="طباعة الفاتورة"
                        disabled={print.isPending}
                        onClick={() => print.mutate(p.order_id)}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      {canManage && p.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          title="حذف الدفعة"
                          className="text-[var(--color-danger)]"
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={current <= 1} onClick={() => setPage(current - 1)}>
            السابق
          </Button>
          <span className="text-[var(--color-ink-soft)]">
            صفحة {current} من {pageCount} ({data?.total ?? 0} دفعة)
          </span>
          <Button variant="outline" size="sm" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
            التالي
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="حذف الدفعة"
        description="بالباك فقط الدفعات المعلّقة بتنحذف، والمؤكدة ما بتتعدّل (للاسترجاع استخدم صفحة الاسترجاعات)."
        confirmLabel="حذف"
        variant="danger"
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
