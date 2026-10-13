import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { cashDrawersApi, type CashDrawer, type CashMovement } from "@/api/cashDrawers";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatTime } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import { EXPENSE_CATEGORY_LABELS } from "@/features/expenses/categories";
import { isOutflow, MOVEMENT_LABELS } from "./movementLabels";


export function CashMovementsPanel({ drawer }: { drawer: CashDrawer }) {
  const queryClient = useQueryClient();
  const canDelete = usePermissions().hasPermission("drawer.manage_all");
  const [deleting, setDeleting] = useState<CashMovement | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["cash-drawer", "movements", drawer.id],
    queryFn: () => cashDrawersApi.movements(drawer.id),
  });

  const remove = useMutation({
    mutationFn: (m: CashMovement) => cashDrawersApi.deleteMovement(drawer.id, m.id),
    onSuccess: () => {
      toast.success("تم حذف الحركة");
      setDeleting(null);
 
      queryClient.invalidateQueries({ queryKey: ["cash-drawer"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const rows = data?.data ?? [];

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">حركات الصندوق</h2>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الوقت</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>المبلغ</TableHead>
              <TableHead>السبب</TableHead>
              <TableHead>سجّلها</TableHead>
              {canDelete && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableEmpty colSpan={canDelete ? 6 : 5}>جارِ التحميل...</TableEmpty>}
            {!isLoading && rows.length === 0 && <TableEmpty colSpan={canDelete ? 6 : 5}>ما في حركات على هالصندوق</TableEmpty>}
            {rows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-[var(--color-ink-soft)]">{formatTime(m.created_at)}</TableCell>
                <TableCell>
                  <Badge variant={m.type === "deposit" ? "success" : m.type === "expense" ? "warning" : "info"}>
                    {MOVEMENT_LABELS[m.type]}
                    {m.type === "expense" && m.expense ? ` — ${EXPENSE_CATEGORY_LABELS[m.expense.category]}` : ""}
                  </Badge>
                </TableCell>
                <TableCell className="tabular">
                  {isOutflow(m.type) ? "−" : "+"} {formatCurrency(m.amount)}
                </TableCell>
                <TableCell className="max-w-64 whitespace-pre-line">{m.reason}</TableCell>
                <TableCell className="text-[var(--color-ink-soft)]">{m.user?.name ?? "—"}</TableCell>
                {canDelete && (
                  <TableCell>
                    <Button variant="ghost" size="sm" aria-label="حذف الحركة" onClick={() => setDeleting(m)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="حذف الحركة؟"
        description={
          deleting?.type === "expense"
            ? "رح ينحذف كمان المصروف المرتبط فيها من سجل المصاريف، وبيرجع المبلغ للمتوقع بالصندوق."
            : "بيرجع المتوقع بالصندوق كأن الحركة ما صارت. الحذف بيتسجّل بسجل التدقيق."
        }
        confirmLabel="حذف"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
      />
    </section>
  );
}
