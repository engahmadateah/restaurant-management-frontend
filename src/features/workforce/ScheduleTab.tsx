import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Check, X, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { shiftSchedulesApi, type ShiftSchedulePayload } from "@/api/shiftSchedules";
import { getApiErrorMessage } from "@/api/client";
import { formatDate } from "@/lib/format";
import type { ShiftSchedule, ShiftScheduleStatus } from "@/types/models";
import { usePermissions } from "@/hooks/usePermissions";
import { ScheduleFormDialog, type ScheduleFormValues } from "./ScheduleFormDialog";

const ALL_STATUS = "all";
const PER_PAGE = 20;

const STATUS_LABELS: Record<ShiftScheduleStatus, string> = {
  scheduled: "مجدولة",
  confirmed: "مؤكّدة",
  cancelled: "ملغاة",
  completed: "منتهية",
};

const STATUS_VARIANTS: Record<ShiftScheduleStatus, "neutral" | "success" | "danger" | "info"> = {
  scheduled: "neutral",
  confirmed: "info",
  cancelled: "danger",
  completed: "success",
};

export function ScheduleTab() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("schedules.manage");

  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftSchedule | null>(null);
  const [deleting, setDeleting] = useState<ShiftSchedule | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["shift-schedules", statusFilter, page],
    queryFn: () =>
      shiftSchedulesApi.list({
        status: statusFilter === ALL_STATUS ? undefined : (statusFilter as ShiftScheduleStatus),
        per_page: PER_PAGE,
        page,
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["shift-schedules"] });

  const createMutation = useMutation({
    mutationFn: shiftSchedulesApi.create,
    onSuccess: () => {
      toast.success("تمت جدولة الوردية");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<ShiftSchedulePayload> }) =>
      shiftSchedulesApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "confirmed" | "cancelled" }) =>
      shiftSchedulesApi.setStatus(id, status),
    onSuccess: () => {
      toast.success("تم تحديث الحالة");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => shiftSchedulesApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الجدولة");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleSubmit(values: ScheduleFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="كل الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_STATUS}>كل الحالات</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canManage && (
          <Button
            className="mr-auto"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            جدولة وردية
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {canManage && <TableHead>الموظف</TableHead>}
            <TableHead>التاريخ</TableHead>
            <TableHead>الوقت</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>ملاحظات</TableHead>
            <TableHead className="w-32 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={6}>جارِ التحميل...</TableEmpty>}
          {!isLoading && data?.data.length === 0 && <TableEmpty colSpan={6}>ما في ورديات مجدولة</TableEmpty>}
          {data?.data.map((sched) => {
            const isOwnScheduledOnly = !canManage && sched.status === "scheduled";
            return (
              <TableRow key={sched.id}>
                {canManage && <TableCell>{sched.user?.name ?? "—"}</TableCell>}
                <TableCell className="tabular text-[var(--color-ink-soft)]">
                  {formatDate(sched.scheduled_date)}
                </TableCell>
                <TableCell className="tabular text-[var(--color-ink-soft)]">
                  {sched.start_time.slice(0, 5)} - {sched.end_time.slice(0, 5)}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[sched.status]}>{STATUS_LABELS[sched.status]}</Badge>
                </TableCell>
                <TableCell className="text-[var(--color-ink-soft)]">{sched.notes || "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {canManage && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="تعديل"
                          onClick={() => {
                            setEditing(sched);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(sched)}>
                          <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                        </Button>
                      </>
                    )}
                    {isOwnScheduledOnly && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="تأكيد"
                          onClick={() => statusMutation.mutate({ id: sched.id, status: "confirmed" })}
                        >
                          <Check className="h-4 w-4 text-[var(--color-success)]" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="إلغاء"
                          onClick={() => statusMutation.mutate({ id: sched.id, status: "cancelled" })}
                        >
                          <X className="h-4 w-4 text-[var(--color-danger)]" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {!!data?.last_page && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>
          <span className="text-sm text-[var(--color-ink-soft)]">
            صفحة {data.current_page} من {data.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>
            التالي
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        schedule={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف جدولة ${deleting?.user?.name ?? ""}؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
