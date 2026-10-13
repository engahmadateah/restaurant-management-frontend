import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { PageLoader } from "@/components/shared/PageLoader";

export function PublicLayout() {
  return (
    <div dir="rtl" className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </div>
  );
}
