import { NavLink } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { navSections } from "@/routes/navConfig";
import { cn } from "@/lib/utils";
import { Wine } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const { hasAnyPermission } = usePermissions();
  const restaurantName = useSettingsStore((s) => s.settings.restaurant_name) || "مطعم زيتون";

  return (
    <aside className="flex h-full w-64 max-w-[85vw] shrink-0 flex-col bg-[var(--color-wine-950)] text-[var(--color-wine-100)]">
      <div className="flex items-center gap-2.5 border-b border-[var(--color-wine-800)] px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-gold-500)]/40 bg-[var(--color-wine-900)]">
          <Wine className="h-4.5 w-4.5 text-[var(--color-gold-300)]" />
        </div>
        <div>
          <p className="font-[var(--font-display)] text-lg font-bold text-[var(--color-gold-100)]">{restaurantName}</p>
          <p className="text-[11px] tracking-wide text-[var(--color-wine-300)]">نظام الإدارة</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.permission || hasAnyPermission(item.permission)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="mb-5">
              <p className="mb-1.5 px-3 text-[11px] font-medium tracking-[0.08em] text-[var(--color-wine-400)] uppercase">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-[var(--color-wine-900)] font-medium text-[var(--color-gold-300)] shadow-[inset_2px_0_0_var(--color-gold-500)] rtl:shadow-[inset_-2px_0_0_var(--color-gold-500)]"
                          : "text-[var(--color-wine-200)] hover:bg-[var(--color-wine-900)]/60 hover:text-white"
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-[var(--color-wine-800)] px-5 py-3 text-center text-[10px] tracking-wide text-[var(--color-wine-500)]">
        صُنع بفخامة لِ{restaurantName}
      </div>
    </aside>
  );
}
