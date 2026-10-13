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
import { slugify } from "@/lib/slugify";
import type { Category } from "@/types/models";

const schema = z.object({
  name: z.string().min(1, "اسم التصنيف مطلوب").max(255),
  slug: z.string().min(1, "المعرّف (slug) مطلوب").max(255),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),

  tax_rate: z
    .union([z.literal(""), z.coerce.number().min(0, "النسبة لازم تكون بين 0 و1").max(1, "النسبة لازم تكون بين 0 و1")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),

  name_en: z.string().max(255).optional(),
});

type CategoryFormInput = z.input<typeof schema>;
export type CategoryFormOutput = z.output<typeof schema>;

export type CategoryFormValues = Omit<CategoryFormOutput, "name_en" | "tax_rate"> & {
  tax_rate?: number | null;
  translations?: { en?: { name?: string } } | null;
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  onSubmit: (values: CategoryFormValues) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormInput, unknown, CategoryFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", is_active: true, sort_order: 0, tax_rate: "", name_en: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        category
          ? {
              name: category.name,
              slug: category.slug,
              is_active: category.is_active,
              sort_order: category.sort_order,
              tax_rate: category.tax_rate !== null ? Number(category.tax_rate) : "",
              name_en: category.translations?.en?.name ?? "",
            }
          : { name: "", slug: "", is_active: true, sort_order: 0, tax_rate: "", name_en: "" }
      );
    }
  }, [open, category, reset]);

  const isActive = watch("is_active");

  function submit(values: CategoryFormOutput) {
    const { name_en, ...rest } = values;
    onSubmit({
      ...rest,

      tax_rate: rest.tax_rate ?? null,
      translations: name_en ? { en: { name: name_en } } : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "تعديل تصنيف" : "تصنيف جديد"}</DialogTitle>
          <DialogDescription>
            {category ? "عدّل بيانات التصنيف" : "أضف تصنيف جديد لقائمة الطعام"}
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit(submit)}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">الاسم</Label>
            <Input
              id="name"
              placeholder="مثال: مقبلات"
              {...register("name", {
                onChange: (e) => {
             
                  if (!category) setValue("slug", slugify(e.target.value));
                },
              })}
            />
            {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">المعرّف (slug)</Label>
            <Input id="slug" dir="ltr" className="text-left" {...register("slug")} />
            {errors.slug && <p className="text-xs text-[var(--color-danger)]">{errors.slug.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sort_order">ترتيب العرض</Label>
            <Input id="sort_order" type="number" {...register("sort_order", { valueAsNumber: true })} />
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2.5">
            <Label htmlFor="is_active" className="cursor-pointer">
              مفعّل (يظهر للزبائن)
            </Label>
            <Switch id="is_active" checked={isActive} onCheckedChange={(v) => setValue("is_active", v)} />
          </div>

          <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax_rate">نسبة ضريبة خاصة بهاد التصنيف (اختياري)</Label>
              <Input id="tax_rate" type="number" step="0.01" min="0" max="1" placeholder="مثال: 0.16 يعني 16%" {...register("tax_rate")} />
              <p className="text-xs text-[var(--color-ink-soft)]">
                سيبها فاضية لاستخدام نسبة الضريبة العامة من الإعدادات. أي صنف تحت هاد التصنيف
                وما إله ضريبة خاصة فيه رح ياخد هاي النسبة.
              </p>
              {errors.tax_rate && <p className="text-xs text-[var(--color-danger)]">{errors.tax_rate.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name_en">الاسم بالإنجليزي (اختياري)</Label>
              <Input id="name_en" dir="ltr" className="text-left" placeholder="e.g. Appetizers" {...register("name_en")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {category ? "حفظ التعديلات" : "إضافة"}
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
