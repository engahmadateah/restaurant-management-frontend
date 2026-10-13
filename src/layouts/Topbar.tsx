import { LogOut, User as UserIcon, KeyRound, Menu, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/api/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roleLabels";
import { NotificationBell } from "./NotificationBell";
import { ClockButton } from "./ClockButton";

export function Topbar({ onMenuClick, onSearchClick }: { onMenuClick?: () => void; onSearchClick?: () => void } = {}) {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  const initials = user?.name?.trim().slice(0, 2) ?? "؟؟";

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
    } finally {
      clear();
      navigate("/login", { replace: true });
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="فتح القائمة"
          className="rounded-[var(--radius-sm)] p-2 text-[var(--color-ink)] hover:bg-[var(--color-wine-50)] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="hidden text-sm text-[var(--color-ink-soft)] sm:block">{formatDate(new Date(), { weekday: "long" })}</p>
        <button
          type="button"
          onClick={onSearchClick}
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 text-sm text-[var(--color-ink-soft)] transition-colors hover:border-[var(--color-gold-500)]"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">بحث سريع</span>
          <kbd className="hidden rounded border border-[var(--color-line)] bg-white px-1.5 font-[var(--font-mono)] text-[10px] md:inline" dir="ltr">Ctrl K</kbd>
        </button>
      </div>
      <div className="flex items-center gap-3">
      <ClockButton />
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-1.5 outline-none hover:bg-[var(--color-wine-50)]">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-[var(--color-ink)]">{user?.name}</p>
            <p className="text-xs text-[var(--color-ink-soft)]">
              {user ? ROLE_LABELS[user.role] : ""}
            </p>
          </div>
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            <UserIcon className="h-4 w-4" /> الملف الشخصي
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/change-password")}>
            <KeyRound className="h-4 w-4" /> تغيير كلمة السر
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-[var(--color-danger)]">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
