import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import type { Currency } from "@/types/models";

const schema = z.object({
  code: z.string().min(1, "رمز العملة مطلوب").max(8),
  name: z.string().min(1, "اسم العملة مطلوب").max(255),
  symbol: z.string().min(1, "رمز العرض مطلوب").max(8),
  exchange_rate: z.coerce.number().min(0.000001, "لازم يكون سعر الصرف أكبر من صفر"),
  is_active: z.boolean(),
});

export type CurrencyFormValues = z.output<typeof schema>;
type CurrencyFormInput = z.input<typeof schema>;

export function CurrencyFormDialog({
  open,
  onOpenChange,
  currency,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency?: Currency | null;
  onSubmit: (values: CurrencyFormValues) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CurrencyFormInput, unknown, CurrencyFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", name: "", symbol: "", exchange_rate: 1, is_active: true },
  });

  useEffect(() => {
    if (open) {
      reset(
        currency
          ? {
              code: currency.code,
              name: currency.name,
              symbol: currency.symbol,
              exchange_rate: Number(currency.exchange_rate),
              is_active: currency.is_active,
            }
          : { code: "", name: "", symbol: "", exchange_rate: 1, is_active: true }
      );
    }
  }, [open, currency, reset]);

  const isActive = watch("is_active");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{currency ? "تعديل العملة" : "عملة جديدة"}</DialogTitle>
          <DialogDescription>
            {currency ? "عدّل بيانات العملة" : "أضف عملة جديدة يقدر النظام يعرض الأسعار فيها"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="code">الرمز (ISO)</Label>
              <Input
                id="code"
                dir="ltr"
                className="text-left uppercase"
                placeholder="مثال: USD"
                disabled={!!currency}
                {...register("code")}
              />
              {errors.code && <p className="text-xs text-[var(--color-danger)]">{errors.code.message}</p>}
              {currency && <p className="text-xs text-[var(--color-ink-soft)]">ما فيك تغيّر رمز عملة موجودة</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="symbol">رمز العرض</Label>
              <Input id="symbol" placeholder="مثال: $" {...register("symbol")} />
              {errors.symbol && <p className="text-xs text-[var(--color-danger)]">{errors.symbol.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" placeholder="مثال: الدولار الأمريكي" {...register("name")} />
            {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="exchange_rate">سعر الصرف مقابل العملة الأساسية</Label>
            <Input
              id="exchange_rate"
              type="number"
              step="0.000001"
              min={0}
              disabled={!!currency?.is_default}
              {...register("exchange_rate")}
            />
            {errors.exchange_rate && (
              <p className="text-xs text-[var(--color-danger)]">{errors.exchange_rate.message}</p>
            )}
            {currency?.is_default && (
              <p className="text-xs text-[var(--color-ink-soft)]">هاي العملة الأساسية حاليًا، سعر صرفها دايمًا 1</p>
            )}
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2.5">
            <Label htmlFor="is_active" className="cursor-pointer">
              مفعّلة (تظهر بقائمة اختيار العملة)
            </Label>
            <Switch id="is_active" checked={isActive} onCheckedChange={(v) => setValue("is_active", v)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {currency ? "حفظ التعديلات" : "إضافة"}
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
