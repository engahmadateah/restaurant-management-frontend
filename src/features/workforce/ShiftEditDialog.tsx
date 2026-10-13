import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import type { ShiftUpdatePayload } from "@/api/shifts";
import type { Shift } from "@/types/models";

const toInput = (iso: string) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm");

export function ShiftEditDialog({
  shift,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  shift: Shift | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (id: number, payload: ShiftUpdatePayload) => void;
  submitting: boolean;
}) {
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (shift) {
      setClockIn(toInput(shift.clock_in));

      setClockOut(toInput(shift.clock_out ?? new Date().toISOString()));
      setNotes(shift.notes ?? "");
    }
  }, [shift]);

  const inMs = new Date(clockIn).getTime();
  const outMs = new Date(clockOut).getTime();
  let error: string | null = null;
  if (!clockIn || !clockOut || Number.isNaN(inMs) || Number.isNaN(outMs)) error = "اكتب وقت الحضور والانصراف";
  else if (outMs <= inMs) error = "الانصراف لازم يكون بعد الحضور";
  else if (outMs > Date.now()) error = "الانصراف ما بيكون بالمستقبل";
  else if (outMs - inMs > 24 * 3600_000) error = "مدة الوردية ما بتتعدى 24 ساعة";

  return (
    <Dialog open={!!shift} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تصحيح وقت الوردية</DialogTitle>
          <DialogDescription>
            {shift?.user?.name ? `${shift.user.name} — ` : ""}
            {shift?.auto_closed
              ? "الوردية انسكرت تلقائياً، اكتب وقت الانصراف الحقيقي"
              : "التعديل بينحفظ باسمك وبيأثر على كشف الراتب القادم"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift_in">الحضور</Label>
              <Input id="shift_in" type="datetime-local" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shift_out">الانصراف</Label>
              <Input id="shift_out" type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shift_notes">ملاحظات</Label>
            <Textarea id="shift_notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && clockIn && clockOut && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={!!error || submitting}
            onClick={() =>
              shift &&
              onSubmit(shift.id, {
                clock_in: new Date(clockIn).toISOString(),
                clock_out: new Date(clockOut).toISOString(),
                notes: notes.trim() === "" ? null : notes,
              })
            }
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
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
