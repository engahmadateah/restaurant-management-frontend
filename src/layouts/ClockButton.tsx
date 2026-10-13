import { LogIn, LogOut, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { shiftsApi } from "@/api/shifts";
import { getApiErrorMessage } from "@/api/client";
import { usePermissions } from "@/hooks/usePermissions";
import { formatTime } from "@/lib/format";


export function ClockButton() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = usePermissions();
  const allowed = hasPermission("shifts.manage_own");

  const { data: shifts } = useQuery({
    queryKey: ["shifts", "my-open", user?.id],
    queryFn: () => shiftsApi.list({ user_id: user!.id, from: format(subDays(new Date(), 7), "yyyy-MM-dd") }),
    enabled: allowed && !!user,
    refetchInterval: 60_000,
  });

  const openShift = shifts?.find((s) => s.user_id === user?.id && !s.clock_out) ?? null;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["shifts"] });

  const clockIn = useMutation({
    mutationFn: () => shiftsApi.clockIn(),
    onSuccess: () => {
      toast.success("تم تسجيل الحضور");
      refresh();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      refresh();
    },
  });

  const clockOut = useMutation({
    mutationFn: () => shiftsApi.clockOut(),
    onSuccess: (shift) => {
      if (shift.auto_closed) toast.warning("ورديتك كانت مفتوحة أكتر من المسموح، فانسكرت عند الحد الأقصى. المدير رح يراجعها.");
      else toast.success("تم تسجيل الانصراف");
      refresh();
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      refresh();
    },
  });

  if (!allowed) return null;

  const pending = clockIn.isPending || clockOut.isPending;

  if (openShift) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => clockOut.mutate()}
        title={`حضورك من ${formatTime(openShift.clock_in)}`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
        انصراف
      </Button>
    );
  }

  return (
    <Button size="sm" disabled={pending} onClick={() => clockIn.mutate()}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
      تسجيل حضور
    </Button>
  );
}
