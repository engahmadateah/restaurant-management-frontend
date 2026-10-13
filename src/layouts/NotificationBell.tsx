import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "@/api/notifications";

export function NotificationBell() {
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
  });
  const count = data?.unread_count ?? 0;

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      title={count > 0 ? `${count} إشعار غير مقروء` : "الإشعارات"}
      className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-soft)] outline-none hover:bg-[var(--color-wine-50)]"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
