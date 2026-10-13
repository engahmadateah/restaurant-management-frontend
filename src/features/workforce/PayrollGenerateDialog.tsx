import { useEffect, useState } from "react";
import { endOfMonth, format, startOfMonth, startOfWeek, subDays, subMonths } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { staffDirectoryApi } from "@/api/staffDirectory";
import { ROLE_LABELS } from "@/lib/roleLabels";
import type { PayrollGeneratePayload } from "@/api/payroll";

const ALL_EMPLOYEES = "all";

const ymd = (d: Date) => format(d, "yyyy-MM-dd");

// اختصارات الفترة. النهاية دايماً <= اليوم (الباك بيرفض فترة ما خلصت)، والبداية الأسبوع بتبدأ الإثنين
// حسب أسبوع ISO يلي بتعتمد عليه حسبة الوقت الإضافي.
function quickPeriods(today = new Date()) {
  const lastMonth = subMonths(today, 1);
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  return [
    { label: "الشهر الماضي", from: ymd(startOfMonth(lastMonth)), to: ymd(endOfMonth(lastMonth)) },
    { label: "الأسبوع الماضي", from: ymd(subDays(thisWeekStart, 7)), to: ymd(subDays(thisWeekStart, 1)) },
    { label: "هالشهر لحد اليوم", from: ymd(startOfMonth(today)), to: ymd(today) },
  ];
}

export function PayrollGenerateDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: PayrollGeneratePayload) => void;
  submitting: boolean;
}) {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [userId, setUserId] = useState(ALL_EMPLOYEES);

  const { data: staffList } = useQuery({
    queryKey: ["users", "for-payroll-generate"],
    queryFn: () => staffDirectoryApi.list({ is_active: true }),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setPeriodStart("");
      setPeriodEnd("");
      setUserId(ALL_EMPLOYEES);
    }
  }, [open]);

  function handleSubmit() {
    onSubmit({
      period_start: periodStart,
      period_end: periodEnd,
      user_id: userId === ALL_EMPLOYEES ? undefined : Number(userId),
    });
  }

  const today = ymd(new Date());
  const endInFuture = !!periodEnd && periodEnd > today;
  const valid = !!periodStart && !!periodEnd && periodEnd >= periodStart && !endInFuture;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>توليد كشوفات راتب</DialogTitle>
          <DialogDescription>
            رح تنحسب الساعات من ورديات الحضور الفعلية (clock-in/out) خلال الفترة المحددة
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {quickPeriods().map((q) => (
              <Button
                key={q.label}
                type="button"
                size="sm"
                variant={periodStart === q.from && periodEnd === q.to ? "default" : "outline"}
                onClick={() => {
                  setPeriodStart(q.from);
                  setPeriodEnd(q.to);
                }}
              >
                {q.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="period_start">من تاريخ</Label>
              <Input id="period_start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="period_end">إلى تاريخ</Label>
              <Input id="period_end" type="date" max={today} value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          {endInFuture && <p className="text-sm text-[var(--color-danger)]">الفترة لسا ما خلصت — اختار نهاية أقصاها اليوم</p>}
          {!!periodStart && !!periodEnd && periodEnd < periodStart && (
            <p className="text-sm text-[var(--color-danger)]">تاريخ النهاية لازم يكون بعد البداية</p>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>الموظف</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_EMPLOYEES}>كل الموظفين النشيطين</SelectItem>
                {staffList?.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name} — {ROLE_LABELS[u.role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" disabled={!valid || submitting} onClick={handleSubmit}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            توليد
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              إلغاء
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
