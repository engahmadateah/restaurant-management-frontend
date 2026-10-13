import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { staffDirectoryApi } from "@/api/staffDirectory";
import { ROLE_LABELS } from "@/lib/roleLabels";
import type { ShiftSchedule } from "@/types/models";

const schema = z
  .object({
    user_id: z.coerce.number().min(1, "اختر موظف"),
    scheduled_date: z.string().min(1, "التاريخ مطلوب"),
    start_time: z.string().min(1, "وقت البداية مطلوب"),
    end_time: z.string().min(1, "وقت النهاية مطلوب"),
    notes: z.string().optional(),
  })
  .refine((v) => v.end_time > v.start_time, {
    message: "وقت النهاية لازم يكون بعد وقت البداية",
    path: ["end_time"],
  });

export type ScheduleFormValues = z.output<typeof schema>;
type ScheduleFormInput = z.input<typeof schema>;

export function ScheduleFormDialog({
  open,
  onOpenChange,
  schedule,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule?: ShiftSchedule | null;
  onSubmit: (values: ScheduleFormValues) => void;
  submitting: boolean;
}) {
  const { data: staffList } = useQuery({
    queryKey: ["users", "for-schedule-form"],
    queryFn: () => staffDirectoryApi.list({ is_active: true }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ScheduleFormInput, unknown, ScheduleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { user_id: 0, scheduled_date: "", start_time: "", end_time: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      reset(
        schedule
          ? {
              user_id: schedule.user_id,
              scheduled_date: schedule.scheduled_date.slice(0, 10),
              start_time: schedule.start_time.slice(0, 5),
              end_time: schedule.end_time.slice(0, 5),
              notes: schedule.notes ?? "",
            }
          : { user_id: 0, scheduled_date: "", start_time: "", end_time: "", notes: "" }
      );
    }
  }, [open, schedule, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{schedule ? "تعديل الجدولة" : "جدولة وردية جديدة"}</DialogTitle>
          <DialogDescription>
            {schedule ? "عدّل تفاصيل الوردية المجدولة" : "حدد الموظف والوقت للوردية القادمة"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-1.5">
            <Label>الموظف</Label>
            <Controller
              control={control}
              name="user_id"
              render={({ field }) => (
                <Select value={field.value ? String(field.value) : ""} onValueChange={(v) => field.onChange(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر موظف" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList?.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.name} — {ROLE_LABELS[u.role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.user_id && <p className="text-xs text-[var(--color-danger)]">{errors.user_id.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="scheduled_date">التاريخ</Label>
            <Input id="scheduled_date" type="date" {...register("scheduled_date")} />
            {errors.scheduled_date && (
              <p className="text-xs text-[var(--color-danger)]">{errors.scheduled_date.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="start_time">من الساعة</Label>
              <Input id="start_time" type="time" {...register("start_time")} />
              {errors.start_time && (
                <p className="text-xs text-[var(--color-danger)]">{errors.start_time.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="end_time">إلى الساعة</Label>
              <Input id="end_time" type="time" {...register("end_time")} />
              {errors.end_time && <p className="text-xs text-[var(--color-danger)]">{errors.end_time.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea id="notes" rows={2} {...register("notes")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {schedule ? "حفظ التعديلات" : "جدولة"}
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
