import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, User as UserIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير عام",
  manager: "مدير",
  cashier: "كاشير",
  waiter: "نادل",
  chef: "شيف",
  driver: "سائق",
};

const schema = z
  .object({
    current_password: z.string().min(1, "كلمة السر الحالية مطلوبة"),
    password: z.string().min(6, "لازم تكون 6 أحرف ع الأقل"),
    password_confirmation: z.string().min(1, "تأكيد كلمة السر مطلوب"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "كلمتا السر مش متطابقتين",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });

  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("تم تغيير كلمة السر بنجاح");
      reset();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الملف الشخصي" description="بيانات حسابك وتغيير كلمة السر" />

      <Card>
        <CardHeader>
          <CardTitle>بياناتي</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-wine-100)] text-[var(--color-wine-700)]">
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-[var(--color-ink)]">{user?.name}</p>
            <p className="text-sm text-[var(--color-ink-soft)]" dir="ltr">
              {user?.email}
            </p>
            {user?.role && <Badge variant="info">{ROLE_LABELS[user.role] ?? user.role}</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تغيير كلمة السر</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex max-w-sm flex-col gap-4"
            onSubmit={handleSubmit((values) => mutation.mutate(values))}
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current_password">كلمة السر الحالية</Label>
              <Input id="current_password" type="password" {...register("current_password")} />
              {errors.current_password && (
                <p className="text-xs text-[var(--color-danger)]">{errors.current_password.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">كلمة السر الجديدة</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password_confirmation">تأكيد كلمة السر الجديدة</Label>
              <Input id="password_confirmation" type="password" {...register("password_confirmation")} />
              {errors.password_confirmation && (
                <p className="text-xs text-[var(--color-danger)]">{errors.password_confirmation.message}</p>
              )}
            </div>
            <Button type="submit" disabled={mutation.isPending} className="self-start">
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ كلمة السر الجديدة
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
