import { Suspense, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";
import { PageLoader } from "@/components/shared/PageLoader";
import { OfflineQueueBanner } from "@/components/shared/OfflineQueueBanner";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const location = useLocation();
  // بيرسل طلبات الكاشير المحفوظة على الجهاز لما يرجع الاتصال (بأي صفحة)
  const syncNow = useOfflineSync();

  // سكّر القائمة الجانبية تلقائيًا عند التنقل (موبايل/تابلت)
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Ctrl+K / ⌘K يفتح البحث السريع بأي صفحة
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // الحاوية الجذر h-screen + overflow-hidden: الـ <main> هو الوحيد يلي بيتحرك بالسكرول،
  // فالـ Sidebar والـ Topbar بيضلوا ثابتين. على الشاشات الصغيرة الـ Sidebar بيصير drawer.
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-paper)]">
      {/* خلفية معتمة خلف الـ drawer على الموبايل */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-40 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} onSearchClick={() => setPaletteOpen(true)} />
        <OfflineQueueBanner onSyncNow={() => void syncNow()} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
