import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck, UserCog, PackageCheck, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { deliveriesApi } from "@/api/deliveries";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import type { DeliveryStatus, Order } from "@/types/models";
import { AssignDriverDialog } from "./AssignDriverDialog";

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار سائق",
  assigned: "معيَّن لسائق",
  out_for_delivery: "قيد التوصيل",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

const STATUS_VARIANTS: Record<string, "neutral" | "success" | "warning" | "danger" | "info" | "gold"> = {
  pending: "warning",
  assigned: "info",
  out_for_delivery: "gold",
  delivered: "success",
  cancelled: "danger",
};

export default function DeliveriesPage() {
  const queryClient = useQueryClient();
  const canAssign = usePermissions().hasPermission("orders.manage");
  const [assigning, setAssigning] = useState<Order | null>(null);

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["deliveries"],
    queryFn: deliveriesApi.list,
    refetchInterval: 20000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["deliveries"] });

  const assignMutation = useMutation({
    mutationFn: ({ orderId, driverId }: { orderId: number; driverId: number }) =>
      deliveriesApi.assignDriver(orderId, driverId),
    onSuccess: () => {
      toast.success("تم تعيين السائق");
      invalidate();
      setAssigning(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: Extract<DeliveryStatus, "out_for_delivery" | "delivered"> }) =>
      deliveriesApi.updateStatus(orderId, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة التوصيل");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="التوصيل" description="متابعة طلبات التوصيل النشطة وتعيين السواقين" />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الطلب</TableHead>
            <TableHead>الزبون</TableHead>
            <TableHead>العنوان</TableHead>
            <TableHead>السائق</TableHead>
            <TableHead>الإجمالي</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-56 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={7}>جارِ التحميل...</TableEmpty>}
          {!isLoading && deliveries?.length === 0 && (
            <TableEmpty colSpan={7}>
              <div className="flex flex-col items-center gap-2 py-4">
                <Truck className="h-8 w-8 text-[var(--color-ink-soft)]/50" />
                ما في طلبات توصيل نشطة حاليًا
              </div>
            </TableEmpty>
          )}
          {deliveries?.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>
                {order.customer?.name ?? "—"}
                <div className="text-xs font-normal text-[var(--color-ink-soft)]">
                  {order.delivery_phone ?? order.customer?.phone ?? ""}
                </div>
              </TableCell>
              <TableCell className="max-w-[220px] truncate text-[var(--color-ink-soft)]">
                {order.delivery_address ?? "—"}
              </TableCell>
              <TableCell>
                {order.driver?.name ?? <span className="text-[var(--color-ink-soft)]">—</span>}
              </TableCell>
              <TableCell className="tabular">{formatCurrency(order.total)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[order.delivery_status ?? "pending"]}>
                  {STATUS_LABELS[order.delivery_status ?? "pending"]}
                </Badge>
                <div className="mt-1 text-xs text-[var(--color-ink-soft)]">{formatDateTime(order.created_at)}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {canAssign && (order.delivery_status === "pending" || !order.delivery_status) && (
                    <Button variant="ghost" size="sm" onClick={() => setAssigning(order)}>
                      <UserCog className="h-4 w-4" />
                      تعيين سائق
                    </Button>
                  )}
                  {order.delivery_status === "assigned" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => statusMutation.mutate({ orderId: order.id, status: "out_for_delivery" })}
                      disabled={statusMutation.isPending}
                    >
                      <PackageCheck className="h-4 w-4" />
                      بدء التوصيل
                    </Button>
                  )}
                  {order.delivery_status === "out_for_delivery" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => statusMutation.mutate({ orderId: order.id, status: "delivered" })}
                      disabled={statusMutation.isPending}
                    >
                      <CheckCheck className="h-4 w-4 text-[var(--color-success)]" />
                      تم التسليم
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AssignDriverDialog
        order={assigning}
        onOpenChange={(open) => !open && setAssigning(null)}
        submitting={assignMutation.isPending}
        onConfirm={(driverId) => assigning && assignMutation.mutate({ orderId: assigning.id, driverId })}
      />
    </div>
  );
}
