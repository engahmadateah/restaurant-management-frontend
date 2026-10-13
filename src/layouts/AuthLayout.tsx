import { Outlet } from "react-router-dom";
import { Wine } from "lucide-react";
import { Flourish } from "@/components/shared/Flourish";
import { useSettingsStore } from "@/stores/settingsStore";

export function AuthLayout() {
  // ملاحظة: هون المستخدم لسا مش مسجل دخول، فمافي token لجلب الإعدادات
  // من الـ API (المسار محمي بـ auth:sanctum). لهيك القيمة المخزنة
  // بالـ store بتكون فاضية أول مرة، وبيرجع للاسم الافتراضي "مطعم زيتون".
  const restaurantName = useSettingsStore((s) => s.settings.restaurant_name) || "مطعم زيتون";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-wine-950)] px-4">
      {/* نسيج زخرفي هادئ — شبكة معينات ذهبية بإحساس قوائم المطاعم الراقية */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid slice"
      >
        {Array.from({ length: 7 }).map((_, row) =>
          Array.from({ length: 7 }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={col * 120 - 40}
              y={row * 120 - 40}
              width="34"
              height="34"
              fill="none"
              stroke="var(--color-gold-300)"
              strokeWidth="1"
              transform={`rotate(45 ${col * 120 - 40 + 17} ${row * 120 - 40 + 17})`}
            />
          ))
        )}
      </svg>

      {/* توهج ذهبي خفيف أعلى البطاقة */}
      <div className="pointer-events-none absolute top-[-12rem] h-96 w-96 rounded-full bg-[var(--color-gold-500)] opacity-[0.12] blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-gold-500)]/40 bg-[var(--color-wine-900)] shadow-[var(--shadow-gold)]">
            <Wine className="h-7 w-7 text-[var(--color-gold-300)]" />
          </div>
          <div>
            <h1 className="font-[var(--font-display)] text-3xl font-bold text-[var(--color-gold-100)]">
              {restaurantName}
            </h1>
            <p className="mt-1 text-sm tracking-wide text-[var(--color-wine-300)]">نظام إدارة المطعم</p>
          </div>
          <div className="mt-2 w-40">
            <Flourish tone="dark" />
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-gold-500)]/15 bg-[var(--color-paper)] p-7 shadow-[var(--shadow-lift)]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
