import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ordersApi } from "@/api/orders";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/types/models";
import type { RefundPayload } from "@/api/refunds";

const schema = z.object({
  order_id: z.coerce.number().min(1, "لازم تختار الطلب"),
  amount: z.coerce.number().min(0.01, "لازم يكون المبلغ أكبر من صفر"),
  reason: z.string().min(1, "سبب الاسترجاع مطلوب").max(500),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

export function RequestRefundDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: RefundPayload) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { order_id: undefined, amount: 0, reason: "" },
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders", "refundable"],
    queryFn: () => ordersApi.list({ per_page: "all" }),
    enabled: open,
  });

  const orders: Order[] = (Array.isArray(ordersData) ? ordersData : (ordersData?.data ?? [])).filter((o) =>
    ["paid", "partial"].includes(o.payment_status)
  );

  useEffect(() => {
    if (open) reset({ order_id: undefined, amount: 0, reason: "" });
  }, [open, reset]);

  const selectedOrderId = watch("order_id");
  const selectedOrder = orders.find((o) => o.id === Number(selectedOrderId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>طلب استرجاع جديد</DialogTitle>
          <DialogDescription>اختر الطلب وحدّد المبلغ المطلوب استرجاعه والسبب</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit((values) =>
            onSubmit({ order_id: values.order_id, amount: values.amount, reason: values.reason })
          )}
        >
          <div className="flex flex-col gap-1.5">
            <Label>الطلب</Label>
            <Controller
              control={control}
              name="order_id"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                  disabled={ordersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={ordersLoading ? "جارِ التحميل..." : "اختر الطلب"} />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((o) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.order_number} — {formatCurrency(o.total)}
                        {o.customer ? ` — ${o.customer.name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.order_id && <p className="text-xs text-[var(--color-danger)]">{errors.order_id.message}</p>}
          </div>

          {selectedOrder && (
            <p className="text-xs text-[var(--color-ink-soft)]">
              إجمالي الطلب: {formatCurrency(selectedOrder.total)} — حالة الدفع:{" "}
              {selectedOrder.payment_status === "paid" ? "مدفوع بالكامل" : "مدفوع جزئيًا"}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">المبلغ المطلوب استرجاعه</Label>
            <Input id="amount" type="number" step="0.01" min={0} {...register("amount")} />
            {errors.amount && <p className="text-xs text-[var(--color-danger)]">{errors.amount.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reason">سبب الاسترجاع</Label>
            <Textarea id="reason" rows={3} placeholder="مثال: خطأ بالطلب، الزبون رجّع الصنف..." {...register("reason")} />
            {errors.reason && <p className="text-xs text-[var(--color-danger)]">{errors.reason.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              إرسال الطلب
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
