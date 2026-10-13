import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AppRouter } from "@/routes";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { settingsApi } from "@/api/settings";
import { useSettingsStore } from "@/stores/settingsStore";
import { useAuthStore } from "@/stores/authStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

// بيحمّل الإعدادات العامة مرة وحدة (وبيعيد التحميل تلقائيًا كل ما
// تتغيّر نتيجة الاستعلام بمفتاح "settings" - يعني لما صفحة الإعدادات
// تحفظ وتعمل invalidateQueries، هاد المكون بيلتقط القيم الجديدة
// وبيحدّث الـ store المركزي يلي كل التطبيق عم يقرأ منه).
function SettingsLoader() {
  const token = useAuthStore((s) => s.token);
  const setSettings = useSettingsStore((s) => s.setSettings);

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
    enabled: !!token, // ما تجيب الإعدادات إلا بعد تسجيل الدخول (المسار محمي)
  });

  useEffect(() => {
    if (data) setSettings(data);
  }, [data, setSettings]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SettingsLoader />
        <AppRouter />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
