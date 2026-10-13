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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Expense, ExpenseCategory } from "@/types/models";
import { EXPENSE_CATEGORY_LABELS } from "./categories";

const schema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(255),
  category: z.enum(["rent", "utilities", "salaries", "supplies", "maintenance", "marketing", "other"]),
  amount: z.coerce.number().min(0.01, "لازم يكون المبلغ أكبر من صفر"),
  expense_date: z.string().min(1, "التاريخ مطلوب"),
  notes: z.string().optional(),
});

export type ExpenseFormValues = z.output<typeof schema>;
type ExpenseFormInput = z.input<typeof schema>;

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense | null;
  onSubmit: (values: ExpenseFormValues) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ExpenseFormInput, unknown, ExpenseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", category: "other", amount: 0, expense_date: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        expense
          ? {
              title: expense.title,
              category: expense.category,
              amount: Number(expense.amount),
              expense_date: expense.expense_date.slice(0, 10),
              notes: expense.notes ?? "",
            }
          : { title: "", category: "other", amount: 0, expense_date: new Date().toISOString().slice(0, 10), notes: "" }
      );
    }
  }, [open, expense, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? "تعديل المصروف" : "مصروف جديد"}</DialogTitle>
          <DialogDescription>{expense ? "عدّل تفاصيل المصروف" : "أضف مصروف جديد للسجل"}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">العنوان</Label>
            <Input id="title" placeholder="مثال: فاتورة كهرباء شهر 7" {...register("title")} />
            {errors.title && <p className="text-xs text-[var(--color-danger)]">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>التصنيف</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">المبلغ (د.أ)</Label>
              <Input id="amount" type="number" step="0.01" min={0} {...register("amount")} />
              {errors.amount && <p className="text-xs text-[var(--color-danger)]">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="expense_date">التاريخ</Label>
            <Input id="expense_date" type="date" {...register("expense_date")} />
            {errors.expense_date && (
              <p className="text-xs text-[var(--color-danger)]">{errors.expense_date.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea id="notes" rows={2} placeholder="تفاصيل إضافية" {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {expense ? "حفظ التعديلات" : "إضافة"}
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

export type { ExpenseCategory };
