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


function SettingsLoader() {
  const token = useAuthStore((s) => s.token);
  const setSettings = useSettingsStore((s) => s.setSettings);

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsApi.get,
    enabled: !!token,
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
