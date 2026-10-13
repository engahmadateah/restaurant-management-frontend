import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MailCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/api/auth";
import { getApiErrorMessage } from "@/api/client";

const schema = z.object({
  email: z.string().min(1, "البريد الإلكتروني مطلوب").email("بريد إلكتروني غير صالح"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-bg,#eef7f0)]">
          <MailCheck className="h-6 w-6 text-[var(--color-success,#2f8a4b)]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-ink)]">تحقق من بريدك الإلكتروني</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            إذا كان هاد الإيميل مسجّل عندنا، رح توصلك رسالة فيها رابط لإعادة تعيين كلمة السر خلال دقائق.
          </p>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-wine-600)] hover:underline"
        >
          <ArrowRight className="h-3.5 w-3.5" />
          الرجوع لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-ink)]">نسيت كلمة السر؟</h2>
        <p className="text-sm text-[var(--color-ink-soft)]">
          أدخل بريدك الإلكتروني وبنبعتلك رابط لإعادة تعيين كلمة السر
        </p>
      </div>

      {serverError && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-danger-bg)] px-3 py-2 text-sm text-[var(--color-danger)]">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">البريد الإلكتروني</Label>
        <Input id="email" type="email" placeholder="name@zeitoun.com" {...register("email")} autoFocus />
        {errors.email && <p className="text-xs text-[var(--color-danger)]">{errors.email.message}</p>}
      </div>

      <Button type="submit" size="lg" disabled={loading} className="mt-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        إرسال رابط إعادة التعيين
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
