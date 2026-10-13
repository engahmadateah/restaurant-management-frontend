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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { RestaurantTable } from "@/types/models";

const schema = z.object({
  table_number: z.string().min(1, "رقم الطاولة مطلوب").max(50),
  capacity: z.coerce.number().int().min(1, "لازم يكون العدد أكبر من صفر"),
  status: z.enum(["available", "occupied", "reserved"]),
});

export type TableFormValues = z.output<typeof schema>;
type TableFormInput = z.input<typeof schema>;

const STATUS_LABELS: Record<TableFormValues["status"], string> = {
  available: "متاحة",
  occupied: "مشغولة",
  reserved: "محجوزة",
};

export function TableFormDialog({
  open,
  onOpenChange,
  table,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table?: RestaurantTable | null;
  onSubmit: (values: TableFormValues) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TableFormInput, unknown, TableFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { table_number: "", capacity: 4, status: "available" },
  });

  useEffect(() => {
    if (open) {
      reset(
        table
          ? { table_number: table.table_number, capacity: table.capacity, status: table.status }
          : { table_number: "", capacity: 4, status: "available" }
      );
    }
  }, [open, table, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{table ? "تعديل الطاولة" : "طاولة جديدة"}</DialogTitle>
          <DialogDescription>{table ? "عدّل بيانات الطاولة" : "أضف طاولة جديدة للمطعم"}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="table_number">رقم الطاولة</Label>
              <Input id="table_number" placeholder="مثال: T1" {...register("table_number")} />
              {errors.table_number && (
                <p className="text-xs text-[var(--color-danger)]">{errors.table_number.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="capacity">السعة (عدد الكراسي)</Label>
              <Input id="capacity" type="number" min={1} step="1" {...register("capacity")} />
              {errors.capacity && (
                <p className="text-xs text-[var(--color-danger)]">{errors.capacity.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>الحالة</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {table ? "حفظ التعديلات" : "إضافة"}
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