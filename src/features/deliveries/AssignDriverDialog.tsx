import { useEffect, useState } from "react";
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { staffDirectoryApi } from "@/api/staffDirectory";
import type { Order } from "@/types/models";

export function AssignDriverDialog({
  order,
  onOpenChange,
  submitting,
  onConfirm,
}: {
  order: Order | null;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  onConfirm: (driverId: number) => void;
}) {
  const [driverId, setDriverId] = useState<string>("");
  const { data: drivers, isLoading } = useQuery({
    queryKey: ["users", "driver"],
    queryFn: () => staffDirectoryApi.list({ role: "driver", is_active: true }),
    enabled: !!order,
  });

  useEffect(() => {
    if (order) setDriverId(order.driver_id ? String(order.driver_id) : "");
  }, [order]);

  return (
    <Dialog open={!!order} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>تعيين سائق</DialogTitle>
          <DialogDescription>
            {order && `اختر السائق يلي رح يوصّل طلب رقم ${order.order_number}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label>السائق</Label>
          <Select value={driverId} onValueChange={setDriverId}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "جارِ التحميل..." : "اختر سائق"} />
            </SelectTrigger>
            <SelectContent>
              {drivers?.length === 0 && (
                <div className="px-3 py-2 text-sm text-[var(--color-ink-soft)]">ما في سواقين متاحين</div>
              )}
              {drivers?.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" disabled={!driverId || submitting} onClick={() => onConfirm(Number(driverId))}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            تعيين
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
