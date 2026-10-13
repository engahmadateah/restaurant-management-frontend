import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";
import { useAuthStore } from "@/stores/authStore";

const schema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("بريد إلكتروني غير صالح"),
  password: z.string().min(1, "كلمة السر مطلوبة"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setLoading(true);
    try {
      const { user, token } = await authApi.login(values.email, values.password);
      setAuth(user, token);
      
      if (user.must_change_password) {
        navigate("/force-password-change", { replace: true });
        return;
      }
      const from = (location.state as { from?: Location })?.from?.pathname ?? "/";
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">تسجيل الدخول</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">أدخل بياناتك للوصول إلى لوحة التحكم</p>
      </div>

      {serverError && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" placeholder="name@zeitoun.com" {...register("email")} />
        {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">كلمة السر</Label>
          <a href="/forgot-password" className="text-xs text-[var(--color-wine-600)] hover:underline">
            نسيت كلمة السر؟
          </a>
        </div>
        <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
        {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        دخول
      </Button>
    </form>
  );
}
