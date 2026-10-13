import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Check, X, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { refundsApi, type RefundPayload } from "@/api/refunds";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import type { Refund, RefundStatus } from "@/types/models";
import { RequestRefundDialog } from "./RequestRefundDialog";
import { RefundDecisionDialog } from "./RefundDecisionDialog";

const NONE = "none";

const STATUS_LABELS: Record<RefundStatus, string> = {
  pending: "بانتظار الموافقة",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
};

const STATUS_BADGE: Record<RefundStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default function RefundsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canDecide = hasPermission("refunds.approve");

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [requestOpen, setRequestOpen] = useState(false);
  const [decision, setDecision] = useState<{ refund: Refund; action: "approve" | "reject" } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["refunds", statusFilter],
    queryFn: () => refundsApi.list({ status: statusFilter === NONE ? undefined : (statusFilter as RefundStatus) }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["refunds"] });

  const createMutation = useMutation({
    mutationFn: (payload: RefundPayload) => refundsApi.create(payload),
    onSuccess: () => {
      toast.success("تم إرسال طلب الاسترجاع، بانتظار موافقة الإدارة");
      invalidate();
      setRequestOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const decisionMutation = useMutation({
    mutationFn: ({ id, action, note }: { id: number; action: "approve" | "reject"; note: string }) =>
      action === "approve" ? refundsApi.approve(id, note) : refundsApi.reject(id, note),
    onSuccess: (_, variables) => {
      toast.success(variables.action === "approve" ? "تمت الموافقة على الاسترجاع" : "تم رفض طلب الاسترجاع");
      invalidate();
      setDecision(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const refunds = data ?? [];
  const pendingCount = refunds.filter((r) => r.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الاسترجاعات"
        description="طلبات استرجاع الأموال على الطلبات المدفوعة"
        action={
          <Button onClick={() => setRequestOpen(true)}>
            <Plus className="h-4 w-4" />
            طلب استرجاع جديد
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>كل الحالات</SelectItem>
            <SelectItem value="pending">بانتظار الموافقة</SelectItem>
            <SelectItem value="approved">تمت الموافقة</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
          </SelectContent>
        </Select>

        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] px-4 py-2 text-sm text-[var(--color-warning)]">
            <Undo2 className="h-4 w-4" />
            {pendingCount} طلب بانتظار قرارك
          </div>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الطلب</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead>السبب</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead>طلبها</TableHead>
            <TableHead>التاريخ</TableHead>
            {canDecide && <TableHead className="w-32 text-left">إجراءات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={canDecide ? 7 : 6}>جارِ التحميل...</TableEmpty>}
          {!isLoading && refunds.length === 0 && (
            <TableEmpty colSpan={canDecide ? 7 : 6}>ما في طلبات استرجاع مطابقة</TableEmpty>
          )}
          {refunds.map((refund) => (
            <TableRow key={refund.id}>
              <TableCell className="font-medium">{refund.order?.order_number ?? `#${refund.order_id}`}</TableCell>
              <TableCell className="tabular">{formatCurrency(refund.amount)}</TableCell>
              <TableCell className="max-w-64 truncate text-[var(--color-ink-soft)]" title={refund.reason ?? ""}>
                {refund.reason ?? "—"}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE[refund.status]}>{STATUS_LABELS[refund.status]}</Badge>
              </TableCell>
              <TableCell className="text-[var(--color-ink-soft)]">{refund.requestedBy?.name ?? "—"}</TableCell>
              <TableCell className="tabular text-[var(--color-ink-soft)]">{formatDateTime(refund.created_at)}</TableCell>
              {canDecide && (
                <TableCell>
                  {refund.status === "pending" ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="موافقة"
                        onClick={() => setDecision({ refund, action: "approve" })}
                      >
                        <Check className="h-4 w-4 text-[var(--color-success)]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="رفض"
                        onClick={() => setDecision({ refund, action: "reject" })}
                      >
                        <X className="h-4 w-4 text-[var(--color-danger)]" />
                      </Button>
                    </div>
                  ) : (
                    <span className="block text-left text-xs text-[var(--color-ink-soft)]">
                      {refund.processedBy?.name ?? "—"}
                    </span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <RequestRefundDialog
        open={requestOpen}
        onOpenChange={setRequestOpen}
        onSubmit={(payload) => createMutation.mutate(payload)}
        submitting={createMutation.isPending}
      />

      <RefundDecisionDialog
        refund={decision?.refund ?? null}
        action={decision?.action ?? null}
        onOpenChange={(open) => !open && setDecision(null)}
        loading={decisionMutation.isPending}
        onConfirm={(note) =>
          decision && decisionMutation.mutate({ id: decision.refund.id, action: decision.action, note })
        }
      />
    </div>
  );
}
