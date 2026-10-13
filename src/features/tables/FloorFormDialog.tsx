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
import type { Floor } from "@/types/models";

const schema = z.object({
  name: z.string().min(1, "اسم الطابق مطلوب").max(255),
  canvas_width: z.coerce.number().int().min(200, "الحد الأدنى 200"),
  canvas_height: z.coerce.number().int().min(200, "الحد الأدنى 200"),
});

export type FloorFormValues = z.output<typeof schema>;
type FloorFormInput = z.input<typeof schema>;

export function FloorFormDialog({
  open,
  onOpenChange,
  floor,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floor?: Floor | null;
  onSubmit: (values: FloorFormValues) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FloorFormInput, unknown, FloorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", canvas_width: 1000, canvas_height: 700 },
  });

  useEffect(() => {
    if (open) {
      reset(
        floor
          ? { name: floor.name, canvas_width: floor.canvas_width, canvas_height: floor.canvas_height }
          : { name: "", canvas_width: 1000, canvas_height: 700 }
      );
    }
  }, [open, floor, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{floor ? "تعديل الطابق" : "طابق جديد"}</DialogTitle>
          <DialogDescription>
            {floor ? "عدّل اسم الطابق أو أبعاد لوحة الرسم" : "أضف طابق/قسم جديد (مثال: التراس، الحديقة)"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">اسم الطابق</Label>
            <Input id="name" placeholder="مثال: الطابق الأرضي" {...register("name")} />
            {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="canvas_width">عرض اللوحة (بيكسل)</Label>
              <Input id="canvas_width" type="number" min={200} step="10" {...register("canvas_width")} />
              {errors.canvas_width && (
                <p className="text-xs text-[var(--color-danger)]">{errors.canvas_width.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="canvas_height">ارتفاع اللوحة (بيكسل)</Label>
              <Input id="canvas_height" type="number" min={200} step="10" {...register("canvas_height")} />
              {errors.canvas_height && (
                <p className="text-xs text-[var(--color-danger)]">{errors.canvas_height.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {floor ? "حفظ التعديلات" : "إضافة"}
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
