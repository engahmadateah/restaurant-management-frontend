import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogIn, LogOut, Clock, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { shiftsApi } from "@/api/shifts";
import type { Shift } from "@/types/models";
import { ShiftEditDialog } from "./ShiftEditDialog";
import { staffDirectoryApi } from "@/api/staffDirectory";
import { getApiErrorMessage } from "@/api/client";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roleLabels";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/authStore";

const ALL_USERS = "all";

function formatDuration(clockIn: string, clockOut: string | null) {
  const start = new Date(clockIn).getTime();
  const end = clockOut ? new Date(clockOut).getTime() : Date.now();
  const minutes = Math.max(0, Math.round((end - start) / 60000));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} س ${m} د`;
}

export function AttendanceTab() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const { hasPermission } = usePermissions();
  const canSeeAll = hasPermission("shifts.manage_all");

  const [userFilter, setUserFilter] = useState(ALL_USERS);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [note, setNote] = useState("");
  
  const [needsReview, setNeedsReview] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);

  const { data: shifts, isLoading } = useQuery({
    queryKey: ["shifts", canSeeAll, userFilter, from, to, needsReview],
    queryFn: () =>
      shiftsApi.list({
        user_id: canSeeAll && userFilter !== ALL_USERS ? Number(userFilter) : undefined,
        from: from || undefined,
        to: to || undefined,
        auto_closed: canSeeAll && needsReview ? true : undefined,
      }),
  });

  const { data: staffList } = useQuery({
    queryKey: ["users", "for-attendance-filter"],
    queryFn: () => staffDirectoryApi.list({ is_active: true }),
    enabled: canSeeAll,
  });

  const openShift = useMemo(
    () => shifts?.find((s) => s.user_id === currentUser?.id && !s.clock_out) ?? null,
    [shifts, currentUser]
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["shifts"] });

  const clockInMutation = useMutation({
    mutationFn: () => shiftsApi.clockIn(note || undefined),
    onSuccess: () => {
      toast.success("تم تسجيل الحضور");
      setNote("");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const clockOutMutation = useMutation({
    mutationFn: () => shiftsApi.clockOut(note || undefined),
    onSuccess: (shift) => {

      if (shift.auto_closed) toast.warning("كانت ورديتك مفتوحة أكتر من المسموح، فانسكرت عند الحد الأقصى. المدير رح يراجعها.");
      else toast.success("تم تسجيل الانصراف");
      setNote("");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof shiftsApi.update>[1] }) =>
      shiftsApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم تصحيح الوردية");
      setEditing(null);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const autoClosedCount = shifts?.filter((s) => s.auto_closed).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-wine-50)]">
            <Clock className="h-5 w-5 text-[var(--color-wine-700)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--color-ink-soft)]">حالتك الحالية</p>
            <p className="font-semibold text-[var(--color-ink)]">
              {openShift ? `وردية مفتوحة من ${formatDateTime(openShift.clock_in)}` : "ما عندك وردية مفتوحة"}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-end gap-2 sm:max-w-md">
          <div className="flex-1">
            <Textarea
              rows={1}
              placeholder="ملاحظة (اختياري)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {openShift ? (
            <Button
              variant="danger"
              disabled={clockOutMutation.isPending}
              onClick={() => clockOutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
              تسجيل انصراف
            </Button>
          ) : (
            <Button disabled={clockInMutation.isPending} onClick={() => clockInMutation.mutate()}>
              <LogIn className="h-4 w-4" />
              تسجيل حضور
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {canSeeAll && (
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="كل الموظفين" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_USERS}>كل الموظفين</SelectItem>
              {staffList?.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} — {ROLE_LABELS[u.role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        {canSeeAll && (
          <Button size="sm" variant={needsReview ? "default" : "outline"} onClick={() => setNeedsReview((v) => !v)}>
            <AlertTriangle className="h-4 w-4" />
            تحتاج مراجعة{!needsReview && autoClosedCount > 0 ? ` (${autoClosedCount})` : ""}
          </Button>
        )}
        {(from || to || userFilter !== ALL_USERS) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom("");
              setTo("");
              setUserFilter(ALL_USERS);
            }}
          >
            مسح الفلاتر
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {canSeeAll && <TableHead>الموظف</TableHead>}
            <TableHead>الحضور</TableHead>
            <TableHead>الانصراف</TableHead>
            <TableHead>المدة</TableHead>
            <TableHead>ملاحظات</TableHead>
            {canSeeAll && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={canSeeAll ? 6 : 4}>جارِ التحميل...</TableEmpty>}
          {!isLoading && shifts?.length === 0 && (
            <TableEmpty colSpan={canSeeAll ? 6 : 4}>ما في ورديات مسجّلة</TableEmpty>
          )}
          {shifts?.map((shift) => (
            <TableRow key={shift.id}>
              {canSeeAll && <TableCell>{shift.user?.name ?? "—"}</TableCell>}
              <TableCell className="tabular text-[var(--color-ink-soft)]">
                {formatDateTime(shift.clock_in)}
              </TableCell>
              <TableCell className="tabular text-[var(--color-ink-soft)]">
                {shift.clock_out ? (
                  <span className="flex flex-col items-start gap-1">
                    {formatDateTime(shift.clock_out)}
                    {shift.auto_closed && <Badge variant="warning">انسكرت تلقائياً</Badge>}
                  </span>
                ) : (
                  <Badge variant="success">مفتوحة</Badge>
                )}
              </TableCell>
              <TableCell className="tabular">{formatDuration(shift.clock_in, shift.clock_out)}</TableCell>
              <TableCell className="whitespace-pre-line text-[var(--color-ink-soft)]">{shift.notes || "—"}</TableCell>
              {canSeeAll && (
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="تصحيح الأوقات"
                    onClick={() => setEditing(shift)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ShiftEditDialog
        shift={editing}
        onOpenChange={(open) => !open && setEditing(null)}
        submitting={updateMutation.isPending}
        onSubmit={(id, payload) => updateMutation.mutate({ id, payload })}
      />
    </div>
  );
}
