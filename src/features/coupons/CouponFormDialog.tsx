import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Coupon } from "@/types/models";

const schema = z
  .object({
    code: z.string().min(1, "كود الكوبون مطلوب").max(50),
    type: z.enum(["percentage", "fixed"]),
    value: z.coerce.number().min(0.01, "لازم تكون القيمة أكبر من صفر"),
    expires_at: z.string().optional(),
    is_active: z.boolean(),
  })

  .refine((data) => data.type !== "percentage" || data.value <= 100, {
    message: "نسبة الخصم ما بتتجاوز 100%",
    path: ["value"],
  });

export type CouponFormValues = z.output<typeof schema>;
type CouponFormInput = z.input<typeof schema>;

export function CouponFormDialog({
  open,
  onOpenChange,
  coupon,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon?: Coupon | null;
  onSubmit: (values: CouponFormValues) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<CouponFormInput, unknown, CouponFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", type: "percentage", value: 0, expires_at: "", is_active: true },
  });

  useEffect(() => {
    if (open) {
      reset(
        coupon
          ? {
              code: coupon.code,
              type: coupon.type,
              value: Number(coupon.value),
              expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 10) : "",
              is_active: coupon.is_active,
            }
          : { code: "", type: "percentage", value: 0, expires_at: "", is_active: true }
      );
    }
  }, [open, coupon, reset]);

  const type = watch("type");
  const isActive = watch("is_active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{coupon ? "تعديل الكوبون" : "كوبون جديد"}</DialogTitle>
          <DialogDescription>
            {coupon ? "عدّل تفاصيل الكوبون" : "أضف كود خصم جديد يقدر الزبون يستخدمه بالطلب"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">كود الكوبون</Label>
            <Input
              id="code"
              dir="ltr"
              className="text-left uppercase"
              placeholder="مثال: RAMADAN25"
              {...register("code")}
            />
            {errors.code && <p className="text-xs text-[var(--color-danger)]">{errors.code.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>نوع الخصم</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                      <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="value">{type === "percentage" ? "النسبة (%)" : "المبلغ"}</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                min={0}
                max={type === "percentage" ? 100 : undefined}
                {...register("value")}
              />
              {errors.value && <p className="text-xs text-[var(--color-danger)]">{errors.value.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expires_at">تاريخ الانتهاء (اختياري)</Label>
            <Input id="expires_at" type="date" {...register("expires_at")} />
            <p className="text-xs text-[var(--color-ink-soft)]">اتركه فاضي لكوبون بدون تاريخ انتهاء</p>
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2.5">
            <Label htmlFor="is_active" className="cursor-pointer">
              مفعّل (يقدر الزبون يستخدمه)
            </Label>
            <Switch id="is_active" checked={isActive} onCheckedChange={(v) => setValue("is_active", v)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {coupon ? "حفظ التعديلات" : "إضافة"}
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
