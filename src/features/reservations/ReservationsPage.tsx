import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Check, X, CheckCheck, CalendarClock, UserX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { reservationsApi, type ReservationPayload } from "@/api/reservations";
import { getApiErrorMessage } from "@/api/client";
import { formatDate } from "@/lib/format";
import type { Reservation, ReservationStatus } from "@/types/models";
import { ReservationFormDialog, type ReservationFormValues } from "./ReservationFormDialog";

const NONE = "none";

function localDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكّد",
  cancelled: "ملغي",
  completed: "مكتمل",
  no_show: "لم يحضر",
};

const STATUS_VARIANTS: Record<ReservationStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  pending: "warning",
  confirmed: "info",
  cancelled: "danger",
  completed: "success",
  no_show: "neutral",
};

export default function ReservationsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>(NONE);
  const [dateFilter, setDateFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [deleting, setDeleting] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState<Reservation | null>(null);
  const [markingNoShow, setMarkingNoShow] = useState<Reservation | null>(null);

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["reservations", statusFilter, dateFilter],
    queryFn: () =>
      reservationsApi.list({
        status: statusFilter === NONE ? undefined : (statusFilter as ReservationStatus),
        date: dateFilter || undefined,
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reservations"] });

  const createMutation = useMutation({
    mutationFn: reservationsApi.create,
    onSuccess: () => {
      toast.success("تمت إضافة الحجز");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReservationPayload }) =>
      reservationsApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reservationsApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الحجز");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => reservationsApi.confirm(id),
    onSuccess: () => {
      toast.success("تم تأكيد الحجز");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => reservationsApi.cancel(id),
    onSuccess: () => {
      toast.success("تم إلغاء الحجز");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      invalidate();
      setCancelling(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => reservationsApi.complete(id),
    onSuccess: () => {
      toast.success("تم تعليم الحجز كمكتمل");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const noShowMutation = useMutation({
    mutationFn: (id: number) => reservationsApi.noShow(id),
    onSuccess: () => {
      toast.success("تم تعليم الحجز: الزبون ما حضر");
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      invalidate();
      setMarkingNoShow(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleSubmit(values: ReservationFormValues) {
    const payload: ReservationPayload = {
      table_id: values.table_id === NONE ? null : Number(values.table_id),
      customer_id: values.customer_id === NONE ? null : Number(values.customer_id),
      customer_name: values.customer_id === NONE ? values.customer_name : undefined,
      customer_phone: values.customer_id === NONE ? values.customer_phone : undefined,
      party_size: values.party_size,
      reservation_date: values.reservation_date,
      reservation_time: values.reservation_time,
      notes: values.notes || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الحجوزات"
        description="إدارة حجوزات الطاولات والمواعيد"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            حجز جديد
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>كل الحالات</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-1.5">
          {[
            { label: "اليوم", value: localDate(0) },
            { label: "بكرا", value: localDate(1) },
          ].map((chip) => (
            <Button
              key={chip.label}
              type="button"
              size="sm"
              variant={dateFilter === chip.value ? "default" : "outline"}
              onClick={() => setDateFilter(dateFilter === chip.value ? "" : chip.value)}
            >
              {chip.label}
            </Button>
          ))}
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-48"
        />
        {dateFilter && (
          <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
            مسح التاريخ
          </Button>
        )}
      </div>

      {!!reservations?.length && (
        <p className="text-sm text-[var(--color-ink-soft)]">
          {reservations.length} حجز · إجمالي{" "}
          <span className="tabular">
            {reservations
              .filter((r) => r.status !== "cancelled" && r.status !== "no_show")
              .reduce((sum, r) => sum + (Number(r.party_size) || 0), 0)}
          </span>{" "}
          شخص (بدون الملغي ولم يحضر)
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الزبون</TableHead>
            <TableHead>الطاولة</TableHead>
            <TableHead>عدد الأشخاص</TableHead>
            <TableHead>التاريخ والوقت</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-48 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={6}>جارِ التحميل...</TableEmpty>}
          {!isLoading && reservations?.length === 0 && (
            <TableEmpty colSpan={6}>
              <div className="flex flex-col items-center gap-2 py-4">
                <CalendarClock className="h-8 w-8 text-[var(--color-ink-soft)]/50" />
                ما في حجوزات مطابقة
              </div>
            </TableEmpty>
          )}
          {reservations?.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">
                {r.customer?.name ?? r.customer_name ?? "—"}
                <div className="text-xs font-normal text-[var(--color-ink-soft)]">
                  {r.customer?.phone ?? r.customer_phone ?? ""}
                </div>
              </TableCell>
              <TableCell>{r.table ? `طاولة ${r.table.table_number}` : "—"}</TableCell>
              <TableCell className="tabular">{r.party_size}</TableCell>
              <TableCell className="tabular">
                {formatDate(r.reservation_date)} · {r.reservation_time?.slice(0, 5)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[r.status]}>{STATUS_LABELS[r.status]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {r.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="تأكيد"
                      onClick={() => confirmMutation.mutate(r.id)}
                      disabled={confirmMutation.isPending}
                    >
                      <Check className="h-4 w-4 text-[var(--color-success)]" />
                    </Button>
                  )}
                  {r.status === "confirmed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="تعليم كمكتمل (وصل الزبون)"
                      onClick={() => completeMutation.mutate(r.id)}
                      disabled={completeMutation.isPending}
                    >
                      <CheckCheck className="h-4 w-4 text-[var(--color-success)]" />
                    </Button>
                  )}
                  {(r.status === "pending" || r.status === "confirmed") && (
                    <Button variant="ghost" size="icon" title="الزبون ما حضر" onClick={() => setMarkingNoShow(r)}>
                      <UserX className="h-4 w-4 text-[var(--color-ink-soft)]" />
                    </Button>
                  )}
                  {(r.status === "pending" || r.status === "confirmed") && (
                    <Button variant="ghost" size="icon" title="إلغاء" onClick={() => setCancelling(r)}>
                      <X className="h-4 w-4 text-[var(--color-danger)]" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="تعديل"
                    onClick={() => {
                      setEditing(r);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(r)}>
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ReservationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        reservation={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف الحجز؟"
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="إلغاء الحجز؟"
        description="رح تترجّع الطاولة متاحة إذا كانت محجوزة بسبب هاد الحجز (إلا إذا في حجز مؤكد تاني ماسكها هلأ)."
        confirmLabel="إلغاء الحجز"
        loading={cancelMutation.isPending}
        onConfirm={() => cancelling && cancelMutation.mutate(cancelling.id)}
      />

      <ConfirmDialog
        open={!!markingNoShow}
        onOpenChange={(open) => !open && setMarkingNoShow(null)}
        title="الزبون ما حضر؟"
        description="رح يتعلّم الحجز كـ«لم يحضر» وتترجّع الطاولة متاحة. ما بينفع تتراجع عن هاد الإجراء."
        confirmLabel="تأكيد"
        loading={noShowMutation.isPending}
        onConfirm={() => markingNoShow && noShowMutation.mutate(markingNoShow.id)}
      />
    </div>
  );
}
