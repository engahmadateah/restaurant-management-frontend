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
import { Switch } from "@/components/ui/switch";
import type { StaffUser } from "@/types/models";

const ROLE_LABELS: Record<string, string> = {
  admin: "أدمن",
  manager: "مدير",
  cashier: "كاشير",
  waiter: "نادل",
  chef: "شيف",
  driver: "سائق",
};

const SALARY_TYPE_LABELS: Record<string, string> = {
  hourly: "بالساعة",
  monthly: "شهري ثابت",
};

const schema = z
  .object({
    name: z.string().min(1, "الاسم مطلوب").max(255),
    email: z.string().email("بريد إلكتروني غير صالح").min(1, "البريد الإلكتروني مطلوب"),
    role: z.enum(["admin", "manager", "cashier", "waiter", "chef", "driver"], {
      message: "الدور مطلوب",
    }),
    phone: z.string().max(30).optional().or(z.literal("")),
    is_active: z.boolean(),
    password: z.string().min(6, "لازم 6 حروف/أرقام على الأقل").optional().or(z.literal("")),
   
    salary_type: z.enum(["hourly", "monthly"], { message: "نوع الراتب مطلوب" }),
    hourly_rate: z.coerce.number().min(0, "لازم يكون رقم موجب"),
    monthly_salary: z.coerce.number().min(0, "لازم يكون رقم موجب"),
    weekly_overtime_threshold_hours: z.coerce
      .number()
      .int("لازم يكون رقم صحيح")
      .min(1, "لازم ساعة وحدة عالأقل"),
    overtime_multiplier: z.coerce.number().min(1, "لازم يكون 1 أو أكتر"),
  })
  .superRefine((data, ctx) => {
 
    if (data.salary_type === "hourly" && (!data.hourly_rate || data.hourly_rate <= 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["hourly_rate"],
        message: "لازم تحدد أجر الساعة (أكبر من صفر) للموظف بالساعة",
      });
    }
    if (data.salary_type === "monthly" && (!data.monthly_salary || data.monthly_salary <= 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["monthly_salary"],
        message: "لازم تحدد الراتب الشهري (أكبر من صفر) للموظف الشهري",
      });
    }
  });

export type UserFormValues = z.output<typeof schema>;
type UserFormInput = z.input<typeof schema>;

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: StaffUser | null;
  onSubmit: (values: UserFormValues) => void;
  submitting: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<UserFormInput, unknown, UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      role: "waiter",
      phone: "",
      is_active: true,
      password: "",
      salary_type: "hourly",
      hourly_rate: 0,
      monthly_salary: 0,
      weekly_overtime_threshold_hours: 40,
      overtime_multiplier: 1.5,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        user
          ? {
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone ?? "",
              is_active: user.is_active,
              password: "",
              salary_type: user.salary_type,
              hourly_rate: user.hourly_rate ? Number(user.hourly_rate) : 0,
              monthly_salary: user.monthly_salary ? Number(user.monthly_salary) : 0,
              weekly_overtime_threshold_hours: user.weekly_overtime_threshold_hours,
              overtime_multiplier: Number(user.overtime_multiplier),
            }
          : {
              name: "",
              email: "",
              role: "waiter",
              phone: "",
              is_active: true,
              password: "",
              salary_type: "hourly",
              hourly_rate: 0,
              monthly_salary: 0,
              weekly_overtime_threshold_hours: 40,
              overtime_multiplier: 1.5,
            }
      );
    }
  }, [open, user, reset]);

  const salaryType = watch("salary_type");

  function submit(values: UserFormValues) {
    if (!user && !values.password) {
      setError("password", { message: "لازم 6 حروف/أرقام على الأقل" });
      return;
    }
    const payload = { ...values };
    if (user && !payload.password) {
      delete payload.password;
    }
    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "تعديل بيانات الموظف" : "موظف جديد"}</DialogTitle>
          <DialogDescription>
            {user ? "عدّل بيانات الموظف ودوره وراتبه" : "أضف حساب موظف جديد للنظام"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" placeholder="مثال: أحمد الزيتوني" {...register("name")} />
            {errors.name && <p className="text-xs text-[var(--color-danger)]">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" placeholder="name@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
            <Input id="phone" placeholder="" {...register("phone")} />
            {errors.phone && <p className="text-xs text-[var(--color-danger)]">{errors.phone.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">الدور</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && <p className="text-xs text-[var(--color-danger)]">{errors.role.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{user ? "كلمة سر جديدة (اختياري)" : "كلمة السر"}</Label>
            <Input id="password" type="password" placeholder="••••••" {...register("password")} />
            {!user && (
              <p className="text-xs text-[var(--color-ink-soft)]">
                كلمة سر مؤقتة: الموظف رح يضطر يغيّرها بأول تسجيل دخول.
              </p>
            )}
            {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
          </div>

          <div className="flex items-center justify-between rounded-md border border-[var(--color-line)] px-3 py-2">
            <Label htmlFor="is_active" className="cursor-pointer">
              الحساب مفعّل
            </Label>
            <Controller
              control={control}
              name="is_active"
              render={({ field }) => (
                <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          {  }
          <div className="flex flex-col gap-4 rounded-md border border-[var(--color-line)] p-3">
            <p className="text-xs font-medium text-[var(--color-ink-soft)]">إعدادات الراتب</p>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salary_type">نوع الراتب</Label>
              <Controller
                control={control}
                name="salary_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="salary_type">
                      <SelectValue placeholder="اختر نوع الراتب" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SALARY_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.salary_type && (
                <p className="text-xs text-[var(--color-danger)]">{errors.salary_type.message}</p>
              )}
            </div>

            {salaryType === "hourly" ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hourly_rate">أجر الساعة</Label>
                <Input id="hourly_rate" type="number" step="0.01" min={0} {...register("hourly_rate")} />
                {errors.hourly_rate && (
                  <p className="text-xs text-[var(--color-danger)]">{errors.hourly_rate.message}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="monthly_salary">الراتب الشهري</Label>
                <Input id="monthly_salary" type="number" step="0.01" min={0} {...register("monthly_salary")} />
                {errors.monthly_salary && (
                  <p className="text-xs text-[var(--color-danger)]">{errors.monthly_salary.message}</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="weekly_overtime_threshold_hours">حد الساعات الإضافية أسبوعيًا</Label>
                <Input
                  id="weekly_overtime_threshold_hours"
                  type="number"
                  step="1"
                  min={1}
                  {...register("weekly_overtime_threshold_hours")}
                />
                {errors.weekly_overtime_threshold_hours && (
                  <p className="text-xs text-[var(--color-danger)]">
                    {errors.weekly_overtime_threshold_hours.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="overtime_multiplier">مضاعف الساعة الإضافية</Label>
                <Input
                  id="overtime_multiplier"
                  type="number"
                  step="0.1"
                  min={1}
                  {...register("overtime_multiplier")}
                />
                {errors.overtime_multiplier && (
                  <p className="text-xs text-[var(--color-danger)]">{errors.overtime_multiplier.message}</p>
                )}
              </div>
            </div>

            {salaryType === "monthly" && (
              <p className="text-xs text-[var(--color-ink-soft)]">
                ملاحظة: الموظف الشهري ما بتأثر ساعاته الإضافية على راتبه، بس بتنسجل للمرجعية.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {user ? "حفظ التعديلات" : "إضافة"}
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
