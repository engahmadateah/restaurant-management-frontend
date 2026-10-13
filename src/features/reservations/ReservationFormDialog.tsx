import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
import { tablesApi } from "@/api/tables";
import { customersApi } from "@/api/customers";
import type { Reservation } from "@/types/models";

const NONE = "none";

function localToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function localNowMinutes() {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const schema = z
  .object({
    table_id: z.string(),
    customer_id: z.string(),
    customer_name: z.string().max(255).optional(),
    customer_phone: z.string().max(50).optional(),
    party_size: z.coerce.number().int().min(1, "لازم يكون شخص واحد ع الأقل"),
    reservation_date: z.string().min(1, "التاريخ مطلوب"),
    reservation_time: z.string().min(1, "الوقت مطلوب"),
    notes: z.string().optional(),
  })
  .refine((data) => data.customer_id !== NONE || (data.customer_name && data.customer_phone), {
    message: "اختر زبون مسجّل أو أدخل اسم ورقم هاتف الزبون",
    path: ["customer_name"],
  });

export type ReservationFormValues = z.output<typeof schema>;
type ReservationFormInput = z.input<typeof schema>;

export function ReservationFormDialog({
  open,
  onOpenChange,
  reservation,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation | null;
  onSubmit: (values: ReservationFormValues) => void;
  submitting: boolean;
}) {
  const { data: tables } = useQuery({ queryKey: ["tables"], queryFn: tablesApi.list, enabled: open });
  const { data: customers } = useQuery({
    queryKey: ["customers", ""],
    queryFn: () => customersApi.list(),
    enabled: open,
  });

  const defaults = useMemo<ReservationFormInput>(
    () => ({
      table_id: reservation?.table_id ? String(reservation.table_id) : NONE,
      customer_id: reservation?.customer_id ? String(reservation.customer_id) : NONE,
      customer_name: reservation?.customer_name ?? "",
      customer_phone: reservation?.customer_phone ?? "",
      party_size: reservation?.party_size ?? 2,
      reservation_date: reservation?.reservation_date?.slice(0, 10) ?? "",
      reservation_time: reservation?.reservation_time?.slice(0, 5) ?? "",
      notes: reservation?.notes ?? "",
    }),
    [reservation]
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<ReservationFormInput, unknown, ReservationFormValues>({ resolver: zodResolver(schema), defaultValues: defaults });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const customerId = watch("customer_id");
  const tableIdValue = watch("table_id");
  const partySizeValue = Number(watch("party_size"));
  const selectedTable = tables?.find((t) => String(t.id) === tableIdValue);
  const overCapacity = !!selectedTable && partySizeValue > Number(selectedTable.capacity);

  function submit(values: ReservationFormValues) {
    if (selectedTable && values.party_size > Number(selectedTable.capacity)) {
      setError("party_size", { message: `الطاولة بتتسع لـ ${selectedTable.capacity} أشخاص بس` });
      return;
    }

    const scheduleChanged =
      !reservation ||
      values.reservation_date !== reservation.reservation_date?.slice(0, 10) ||
      values.reservation_time !== reservation.reservation_time?.slice(0, 5);

    if (scheduleChanged) {
      if (values.reservation_date < localToday()) {
        setError("reservation_date", { message: "تاريخ الحجز لازم يكون اليوم أو بعده" });
        return;
      }
      if (values.reservation_date === localToday()) {
        const [h, m] = values.reservation_time.split(":").map(Number);
        if (h * 60 + m < localNowMinutes()) {
          setError("reservation_time", { message: "وقت الحجز فات، اختر وقت قادم" });
          return;
        }
      }
    }

    onSubmit(values);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{reservation ? "تعديل الحجز" : "حجز جديد"}</DialogTitle>
          <DialogDescription>
            {reservation ? "عدّل تفاصيل الحجز" : "أضف حجز طاولة جديد"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>الطاولة (اختياري)</Label>
              <Controller
                control={control}
                name="table_id"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="بدون طاولة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>بدون طاولة محددة</SelectItem>
                      {tables?.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          طاولة {t.table_number} ({t.capacity} أشخاص)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="party_size">عدد الأشخاص</Label>
              <Input id="party_size" type="number" min={1} {...register("party_size")} />
              {errors.party_size && (
                <p className="text-xs text-[var(--color-danger)]">{errors.party_size.message}</p>
              )}
              {!errors.party_size && overCapacity && (
                <p className="text-xs text-[var(--color-warning)]">
                  أكبر من سعة الطاولة ({selectedTable?.capacity})
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>زبون مسجّل (اختياري)</Label>
            <Controller
              control={control}
              name="customer_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="بدون زبون مسجّل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>زبون غير مسجّل (أدخل بياناته تحت)</SelectItem>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} — {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {customerId === NONE && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer_name">اسم الزبون</Label>
                <Input id="customer_name" placeholder="مثال: أحمد الزيتوني" {...register("customer_name")} />
                {errors.customer_name && (
                  <p className="text-xs text-[var(--color-danger)]">{errors.customer_name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="customer_phone">رقم الهاتف</Label>
                <Input id="customer_phone" placeholder="079xxxxxxx" {...register("customer_phone")} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reservation_date">التاريخ</Label>
              <Input
                id="reservation_date"
                type="date"
                min={reservation ? undefined : localToday()}
                {...register("reservation_date")}
              />
              {errors.reservation_date && (
                <p className="text-xs text-[var(--color-danger)]">{errors.reservation_date.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reservation_time">الوقت</Label>
              <Input id="reservation_time" type="time" {...register("reservation_time")} />
              {errors.reservation_time && (
                <p className="text-xs text-[var(--color-danger)]">{errors.reservation_time.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea id="notes" rows={2} placeholder="مثال: يفضّل طاولة قرب الشباك" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {reservation ? "حفظ التعديلات" : "إضافة الحجز"}
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
