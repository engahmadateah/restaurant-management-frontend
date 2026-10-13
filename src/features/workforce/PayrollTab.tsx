import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Eye, ChevronRight, ChevronLeft, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { payrollApi } from "@/api/payroll";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payroll, PayrollStatus } from "@/types/models";
import { usePermissions } from "@/hooks/usePermissions";
import { usePayslip } from "@/hooks/usePayslip";
import { downloadBlob } from "@/lib/download";
import { PayrollGenerateDialog } from "./PayrollGenerateDialog";
import { PayrollDetailDialog } from "./PayrollDetailDialog";

const ALL_STATUS = "all";
const PER_PAGE = 20;

const STATUS_LABELS: Record<PayrollStatus, string> = { draft: "مسودة", approved: "معتمد", paid: "مدفوع" };
const STATUS_VARIANTS: Record<PayrollStatus, "neutral" | "info" | "success"> = {
  draft: "neutral",
  approved: "info",
  paid: "success",
};

export function PayrollTab() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("payroll.manage");
  const payslip = usePayslip();

  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewing, setViewing] = useState<Payroll | null>(null);
  const [deleting, setDeleting] = useState<Payroll | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["payroll", statusFilter, page],
    queryFn: () =>
      payrollApi.list({
        status: statusFilter === ALL_STATUS ? undefined : (statusFilter as PayrollStatus),
        per_page: PER_PAGE,
        page,
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["payroll"] });

  
  const exportMutation = useMutation({
    mutationFn: (format: "xlsx" | "csv") =>
      payrollApi
        .exportFile({ format, status: statusFilter === ALL_STATUS ? undefined : (statusFilter as PayrollStatus) })
        .then((blob) => ({ blob, format })),
    onSuccess: ({ blob, format }) => downloadBlob(blob, `payroll-${new Date().toISOString().slice(0, 10)}.${format}`),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const generateMutation = useMutation({
    mutationFn: payrollApi.generate,
    onSuccess: (res) => {
      const parts = [`تم توليد ${res.generated.length} كشف`];
      if (res.skipped.length) parts.push(`تم تخطي ${res.skipped.length} (عندهم كشف أصلاً بنفس الفترة)`);
      toast.success(parts.join(" — "));

  
      if (res.conflicts?.length) {
        const list = res.conflicts
          .map((c) => `${c.user} (${formatDate(c.period_start)} → ${formatDate(c.period_end)})`)
          .join("، ");
        toast.warning(`ما انولّد كشف لـ ${res.conflicts.length} موظف لأن الفترة بتتداخل مع كشف موجود: ${list}`, {
          duration: 12_000,
        });
      }

      if (res.warnings?.length) {
        const list = res.warnings
          .map((w) => {
            const bits = [];
            if (w.open_shifts) bits.push(`${w.open_shifts} مفتوحة`);
            if (w.auto_closed_shifts) bits.push(`${w.auto_closed_shifts} منسية`);
            return `${w.user} (${bits.join("، ")})`;
          })
          .join("، ");
        toast.warning(`راجع الورديات قبل اعتماد الكشوفات — ${list}. صحّحها من تبويب الحضور.`, { duration: 12_000 });
      }
      invalidate();
      setGenerateOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, deductions, notes }: { id: number; deductions: number; notes: string }) =>
      payrollApi.update(id, { deductions, notes }),
    onSuccess: (updated) => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setViewing(updated);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => payrollApi.approve(id),
    onSuccess: (updated) => {
      toast.success("تم اعتماد الكشف");
      invalidate();
      setViewing(updated);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => payrollApi.markPaid(id),
    onSuccess: (updated) => {
      toast.success("تم تأشير الكشف كمدفوع");
      invalidate();
      setViewing(updated);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => payrollApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الكشف");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

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
          <div className="mr-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate("xlsx")}>
              <FileSpreadsheet className="h-4 w-4" />
              تصدير Excel
            </Button>
            <Button variant="ghost" size="sm" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate("csv")}>
              CSV
            </Button>
            <Button onClick={() => setGenerateOpen(true)}>
              <Plus className="h-4 w-4" />
              توليد كشوفات
            </Button>
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {canManage && <TableHead>الموظف</TableHead>}
            <TableHead>الفترة</TableHead>
            <TableHead>الصافي المستحق</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-32 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={5}>جارِ التحميل...</TableEmpty>}
          {!isLoading && data?.data.length === 0 && <TableEmpty colSpan={5}>ما في كشوفات رواتب</TableEmpty>}
          {data?.data.map((p) => (
            <TableRow key={p.id}>
              {canManage && <TableCell>{p.user?.name ?? "—"}</TableCell>}
              <TableCell className="tabular text-[var(--color-ink-soft)]">
                {formatDate(p.period_start)} - {formatDate(p.period_end)}
              </TableCell>
              <TableCell className="tabular font-medium">{formatCurrency(p.net_pay)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[p.status]}>{STATUS_LABELS[p.status]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" title="عرض" onClick={() => setViewing(p)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {p.status !== "draft" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="كشف الراتب PDF"
                      disabled={payslip.isPending}
                      onClick={() => payslip.mutate(p.id)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                  {canManage && p.status === "draft" && (
                    <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(p)}>
                      <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
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

      <PayrollGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSubmit={(payload) => generateMutation.mutate(payload)}
        submitting={generateMutation.isPending}
      />

      <PayrollDetailDialog
        payroll={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        canManage={canManage}
        onSaveDeductions={(id, deductions, notes) => updateMutation.mutate({ id, deductions, notes })}
        onApprove={(id) => approveMutation.mutate(id)}
        onMarkPaid={(id) => markPaidMutation.mutate(id)}
        saving={updateMutation.isPending}
        approving={approveMutation.isPending}
        markingPaid={markPaidMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف كشف الراتب؟"
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
