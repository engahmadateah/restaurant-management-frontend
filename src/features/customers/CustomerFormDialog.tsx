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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/types/models";

const schema = z.object({
  name: z.string().min(1, "الاسم مطلوب").max(255),
  phone: z.string().min(1, "رقم الهاتف مطلوب").max(30),
  email: z.string().email("بريد إلكتروني غير صالح").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
});

export type CustomerFormValues = z.infer<typeof schema>;

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (values: CustomerFormValues) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", email: "", address: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        customer
          ? {
              name: customer.name,
              phone: customer.phone,
              email: customer.email ?? "",
              address: customer.address ?? "",
            }
          : { name: "", phone: "", email: "", address: "" }
      );
    }
  }, [open, customer, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{customer ? "تعديل بيانات الزبون" : "زبون جديد"}</DialogTitle>
          <DialogDescription>
            {customer ? "عدّل بيانات الزبون" : "أضف زبون جديد لقاعدة البيانات"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" placeholder="مثال: أحمد الزيتوني" {...register("name")} />
            {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input id="phone" placeholder="079xxxxxxx" {...register("phone")} />
            {errors.phone && <p className="text-xs text-[var(--color-danger)]">{errors.phone.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
            <Input id="email" type="email" placeholder="name@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">العنوان (اختياري)</Label>
            <Textarea id="address" rows={2} placeholder="العنوان الكامل" {...register("address")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {customer ? "حفظ التعديلات" : "إضافة"}
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
