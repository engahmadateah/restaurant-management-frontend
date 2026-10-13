import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

const schema = z
  .object({
    current_password: z.string().min(1, "كلمة السر المؤقتة مطلوبة"),
    password: z.string().min(6, "لازم تكون 6 أحرف ع الأقل"),
    password_confirmation: z.string().min(1, "تأكيد كلمة السر مطلوب"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "كلمتا السر مش متطابقتين",
    path: ["password_confirmation"],
  })
  .refine((d) => d.password !== d.current_password, {
    message: "لازم تكون مختلفة عن كلمة السر المؤقتة",
    path: ["password"],
  });

type FormValues = z.infer<typeof schema>;


export default function ForcePasswordChangePage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await authApi.changePassword(values);
      // الباك اند حفظ كلمة السر وشال الإجبار: منحدّث المستخدم المحلي وبيفتح النظام
      if (res.user) {
        updateUser(res.user);
      } else if (user) {
        updateUser({ ...user, must_change_password: false });
      }
      toast.success("تم تغيير كلمة السر، أهلاً فيك");
      navigate("/", { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // حتى لو فشل الطلب منطلّعه محلياً
    }
    clear();
    navigate("/login", { replace: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">غيّر كلمة السر</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {user?.name ? `أهلاً ${user.name}، ` : ""}هاد أول دخول لحسابك. لازم تختار كلمة سر خاصة فيك قبل ما تكمّل.
        </p>
      </div>

      {serverError && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="current_password">كلمة السر المؤقتة (يلي أعطاك ياها المدير)</Label>
        <Input id="current_password" type="password" autoComplete="current-password" {...register("current_password")} />
        {errors.current_password && (
          <p className="text-xs text-[var(--color-danger)]">{errors.current_password.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">كلمة السر الجديدة</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password_confirmation">تأكيد كلمة السر الجديدة</Label>
        <Input
          id="password_confirmation"
          type="password"
          autoComplete="new-password"
          {...register("password_confirmation")}
        />
        {errors.password_confirmation && (
          <p className="text-xs text-[var(--color-danger)]">{errors.password_confirmation.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        حفظ ومتابعة
      </Button>

      <Button type="button" variant="ghost" size="sm" onClick={handleLogout} className="self-center">
        <LogOut className="h-4 w-4" />
        تسجيل الخروج
      </Button>
    </form>
  );
}
