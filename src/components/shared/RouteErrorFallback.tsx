import { useRouteError, isRouteErrorResponse } from "react-router-dom";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";


export function RouteErrorFallback() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : String(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-paper)] px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-bg)]">
        <AlertTriangle className="h-7 w-7 text-[var(--color-danger)]" />
      </div>
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">صار في خطأ غير متوقع</h1>
        <p className="mt-1 max-w-sm text-sm text-[var(--color-ink-soft)]">
          في مشكلة تقنية صارت وإحنا عم نحمّل الصفحة. جرّب تعيد التحميل، وإذا استمرت
          المشكلة تواصل مع الدعم الفني.
        </p>
      </div>
      <Button onClick={() => window.location.reload()}>
        <RotateCcw className="h-4 w-4" />
        إعادة تحميل الصفحة
      </Button>
      {import.meta.env.DEV && (
        <pre
          className="mt-4 max-w-xl overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-paper-dim)] p-3 text-left text-xs text-[var(--color-danger)]"
          dir="ltr"
        >
          {message}
        </pre>
      )}
    </div>
  );
}
