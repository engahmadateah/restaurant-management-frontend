import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowRight, CheckCircle2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";

const schema = z
  .object({
    password: z.string().min(6, "لازم تكون كلمة السر 6 محارف عالأقل"),
    password_confirmation: z.string().min(1, "تأكيد كلمة السر مطلوب"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "كلمتا السر مش متطابقتين",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

 
  if (!token || !email) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-bg)]">
          <TriangleAlert className="h-6 w-6 text-[var(--color-danger)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">رابط غير صالح</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            هاد الرابط ناقص أو غير صحيح. جرّب تطلب رابط استعادة جديد.
          </p>
        </div>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-wine-600)] hover:underline"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          طلب رابط جديد
        </Link>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setLoading(true);
    try {
      await authApi.resetPassword({ token, email, ...values });
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-bg,#eef7f0)]">
          <CheckCircle2 className="h-6 w-6 text-[var(--color-success,#2f8a4b)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">تم تغيير كلمة السر</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">رح ننقلك لصفحة تسجيل الدخول...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">إعادة تعيين كلمة السر</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">اختار كلمة سر جديدة لحسابك ({email})</p>
      </div>

      {serverError && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">كلمة السر الجديدة</Label>
        <Input id="password" type="password" placeholder="••••••••" {...register("password")} autoFocus />
        {errors.password && <p className="text-xs text-[var(--color-danger)]">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password_confirmation">تأكيد كلمة السر</Label>
        <Input id="password_confirmation" type="password" placeholder="••••••••" {...register("password_confirmation")} />
        {errors.password_confirmation && (
          <p className="text-xs text-[var(--color-danger)]">{errors.password_confirmation.message}</p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        تعيين كلمة السر
      </Button>

      <Link
        to="/login"
        className="inline-flex items-center justify-center gap-1.5 text-sm text-[var(--color-wine-600)] hover:underline"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        الرجوع لتسجيل الدخول
      </Link>
    </form>
  );
}
