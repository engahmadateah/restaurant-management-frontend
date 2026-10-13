import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ImagePlus } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Category, MenuItem } from "@/types/models";

const schema = z.object({
  category_id: z.number({ message: "التصنيف مطلوب" }).int().positive("اختر تصنيف"),
  name: z.string().min(1, "اسم الصنف مطلوب").max(255),
  description: z.string().max(2000).optional(),
  price: z.number().min(0, "السعر لازم يكون رقم موجب"),
  is_available: z.boolean(),
  sort_order: z.number().int().min(0),

  tax_rate: z
    .union([z.literal(""), z.coerce.number().min(0, "النسبة لازم تكون بين 0 و1").max(1, "النسبة لازم تكون بين 0 و1")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
 
  name_en: z.string().max(255).optional(),
  description_en: z.string().max(2000).optional(),
});

type MenuItemFormInput = z.input<typeof schema>;
export type MenuItemFormOutput = z.output<typeof schema>;

export type MenuItemFormValues = Omit<MenuItemFormOutput, "name_en" | "description_en" | "tax_rate"> & {
  tax_rate?: number | null;
  translations?: { en?: { name?: string; description?: string } } | null;
};

export function MenuItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
  onSubmit,
  onImageChange,
  submitting,
  uploadingImage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  categories: Category[];
  onSubmit: (values: MenuItemFormValues) => void;
  onImageChange?: (file: File) => void;
  submitting: boolean;
  uploadingImage?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MenuItemFormInput, unknown, MenuItemFormOutput>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: undefined,
      name: "",
      description: "",
      price: 0,
      is_available: true,
      sort_order: 0,
      tax_rate: "",
      name_en: "",
      description_en: "",
    },
  });

  useEffect(() => {
    if (open) {
      setPreview(null);
      reset(
        item
          ? {
              category_id: item.category_id,
              name: item.name,
              description: item.description ?? "",
              price: Number(item.price),
              is_available: item.is_available,
              sort_order: item.sort_order,
              tax_rate: item.tax_rate !== null ? Number(item.tax_rate) : "",
              name_en: item.translations?.en?.name ?? "",
              description_en: item.translations?.en?.description ?? "",
            }
          : {
              category_id: categories[0]?.id,
              name: "",
              description: "",
              price: 0,
              is_available: true,
              sort_order: 0,
              tax_rate: "",
              name_en: "",
              description_en: "",
            }
      );
    }
  }, [open, item, categories, reset]);

  const isAvailable = watch("is_available");

  const imageUrl = preview ?? (item?.image ? `/storage/${item.image}` : null);

  function submit(values: MenuItemFormOutput) {
    const { name_en, description_en, ...rest } = values;
    const hasTranslation = !!(name_en || description_en);
    onSubmit({
      ...rest,

      tax_rate: rest.tax_rate ?? null,
      translations: hasTranslation ? { en: { name: name_en, description: description_en } } : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{item ? "تعديل صنف" : "صنف جديد"}</DialogTitle>
          <DialogDescription>
            {item ? "عدّل بيانات الصنف" : "أضف صنف جديد لقائمة الطعام"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
          {item && (
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-wine-50)]">
                {imageUrl ? (
                  <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus className="h-6 w-6 text-[var(--color-wine-400)]" />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPreview(URL.createObjectURL(file));
                      onImageChange?.(file);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
                  تغيير الصورة
                </Button>
                <p className="text-xs text-[var(--color-ink-soft)]">JPG أو PNG، أقصى حجم 2 ميغا</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="name">اسم الصنف</Label>
              <Input id="name" placeholder="مثال: حمص بيروتي" {...register("name")} />
              {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>التصنيف</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select value={field.value ? String(field.value) : undefined} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر تصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p className="text-xs text-[var(--color-danger)]">{errors.category_id.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">السعر (د.أ)</Label>
              <Input id="price" type="number" step="0.01" min="0" {...register("price", { valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-[var(--color-danger)]">{errors.price.message}</p>}
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="description">الوصف</Label>
              <Textarea id="description" rows={3} placeholder="وصف مختصر للصنف (اختياري)" {...register("description")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sort_order">ترتيب العرض</Label>
              <Input id="sort_order" type="number" {...register("sort_order", { valueAsNumber: true })} />
            </div>

            <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2.5">
              <Label htmlFor="is_available" className="cursor-pointer">
                متوفر حاليًا
              </Label>
              <Switch id="is_available" checked={isAvailable} onCheckedChange={(v) => setValue("is_available", v)} />
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tax_rate">نسبة ضريبة خاصة بهاد الصنف (اختياري)</Label>
              <Input
                id="tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="مثال: 0.16 يعني 16%"
                {...register("tax_rate")}
              />
              <p className="text-xs text-[var(--color-ink-soft)]">
                سيبها فاضية لاستخدام ضريبة التصنيف وإلا النسبة العامة من الإعدادات.
              </p>
              {errors.tax_rate && <p className="text-xs text-[var(--color-danger)]">{errors.tax_rate.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name_en">الاسم بالإنجليزي (اختياري)</Label>
                <Input id="name_en" dir="ltr" className="text-left" placeholder="e.g. Beirut Hummus" {...register("name_en")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description_en">الوصف بالإنجليزي (اختياري)</Label>
                <Input id="description_en" dir="ltr" className="text-left" {...register("description_en")} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {item ? "حفظ التعديلات" : "إضافة"}
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
