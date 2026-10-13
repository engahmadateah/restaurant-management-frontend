import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Pencil, Search, Trash2, TicketPercent } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { couponsApi, type CouponPayload } from "@/api/coupons";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import type { Coupon } from "@/types/models";
import { CouponFormDialog, type CouponFormValues } from "./CouponFormDialog";

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const canManage = usePermissions().hasPermission("coupons.manage");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "disabled">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: couponsApi.list,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["coupons"] });

  const createMutation = useMutation({
    mutationFn: couponsApi.create,
    onSuccess: () => {
      toast.success("تمت إضافة الكوبون");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CouponPayload> }) =>
      couponsApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => couponsApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الكوبون");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleSubmit(values: CouponFormValues) {
    const payload: CouponPayload = { ...values, expires_at: values.expires_at || null };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function isExpired(coupon: Coupon) {
    if (!coupon.expires_at) return false;
    return new Date(coupon.expires_at) < new Date(new Date().toDateString());
  }

  function statusOf(coupon: Coupon): "active" | "expired" | "disabled" {
    if (!coupon.is_active) return "disabled";
    return isExpired(coupon) ? "expired" : "active";
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (c) => (!q || c.code.toLowerCase().includes(q)) && (statusFilter === "all" || statusOf(c) === statusFilter)
    );
 
  }, [data, search, statusFilter]);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`تم نسخ الكود ${code}`);
    } catch {
      toast.error("تعذّر النسخ");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الكوبونات"
        description="أكواد الخصم يلي يقدر الزبون يستخدمها وقت الدفع"
        action={
          canManage && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              كوبون جديد
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالكود..." className="pr-9" dir="ltr" />
        </div>
        <div className="flex gap-1.5">
          {([["all", "الكل"], ["active", "فعّال"], ["expired", "منتهي"], ["disabled", "معطّل"]] as const).map(([value, label]) => (
            <Button key={value} size="sm" variant={statusFilter === value ? "default" : "outline"} onClick={() => setStatusFilter(value)}>
              {label}
            </Button>
          ))}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">الكود</TableHead>
            <TableHead>نوع الخصم</TableHead>
            <TableHead>القيمة</TableHead>
            <TableHead>تاريخ الانتهاء</TableHead>
            <TableHead>الحالة</TableHead>
            {canManage && <TableHead className="w-24 text-left">إجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={6}>جارِ التحميل...</TableEmpty>}
          {!isLoading && data && data.length > 0 && visible.length === 0 && (
            <TableEmpty colSpan={6}>ما في كوبونات مطابقة</TableEmpty>
          )}
          {!isLoading && data?.length === 0 && (
            <TableEmpty colSpan={6}>
              <div className="flex flex-col items-center gap-2 py-4">
                <TicketPercent className="h-8 w-8 text-[var(--color-ink-soft)]" />
                ما في كوبونات مضافة بعد
              </div>
            </TableEmpty>
          )}
          {visible.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell dir="ltr" className="text-left font-mono font-medium">
                <span className="inline-flex items-center gap-1.5">
                  {coupon.code}
                  <button
                    type="button"
                    title="نسخ الكود"
                    onClick={() => copyCode(coupon.code)}
                    className="rounded p-1 text-[var(--color-ink-soft)] hover:bg-[var(--color-wine-50)]"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </span>
              </TableCell>
              <TableCell>{coupon.type === "percentage" ? "نسبة مئوية" : "مبلغ ثابت"}</TableCell>
              <TableCell className="tabular">
                {coupon.type === "percentage" ? `${Number(coupon.value)}%` : formatCurrency(coupon.value)}
              </TableCell>
              <TableCell className="tabular text-[var(--color-ink-soft)]">
                {coupon.expires_at ? formatDate(coupon.expires_at) : "بدون تاريخ انتهاء"}
              </TableCell>
              <TableCell>
                {!coupon.is_active ? (
                  <Badge variant="neutral">معطّل</Badge>
                ) : isExpired(coupon) ? (
                  <Badge variant="warning">منتهي</Badge>
                ) : (
                  <Badge variant="success">فعّال</Badge>
                )}
              </TableCell>
              {canManage && (
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="تعديل"
                    onClick={() => {
                      setEditing(coupon);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(coupon)}>
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CouponFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        coupon={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف الكوبون "${deleting?.code}"؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
