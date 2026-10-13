import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Award, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loyaltyApi } from "@/api/customers";
import { getApiErrorMessage } from "@/api/client";
import { formatDateTime } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import type { Customer } from "@/types/models";

export function CustomerLoyaltyDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}) {
  const queryClient = useQueryClient();
  const canAdjust = usePermissions().hasPermission("customers.manage");
  const [points, setPoints] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["loyalty", customer?.id],
    queryFn: () => loyaltyApi.show(customer!.id),
    enabled: open && !!customer,
  });

  const adjustMutation = useMutation({
    mutationFn: (payload: { points: number; description?: string }) => loyaltyApi.adjust(customer!.id, payload),
    onSuccess: () => {
      toast.success("تم تعديل رصيد النقاط");
      setPoints("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["loyalty", customer?.id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleAdjust(sign: 1 | -1) {
    const value = Number(points);
    if (!value || value <= 0) {
      toast.error("أدخل عدد نقاط صحيح");
      return;
    }
    adjustMutation.mutate({ points: value * sign, description: description || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>نقاط الولاء — {customer?.name}</DialogTitle>
          <DialogDescription>رصيد النقاط الحالي وسجل الحركات</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-gold-100)] p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-gold-500)]">
            <Award className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-soft)]">الرصيد الحالي</p>
            <p className="tabular text-xl font-bold text-[var(--color-ink)]">
              {isLoading ? "..." : (data?.loyalty_points ?? customer?.loyalty_points ?? 0)} نقطة
            </p>
          </div>
        </div>

        {canAdjust && (
        <div className="flex flex-col gap-2">
          <Label>تعديل يدوي</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              placeholder="عدد النقاط"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={adjustMutation.isPending}
              onClick={() => handleAdjust(1)}
              title="إضافة"
            >
              {adjustMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={adjustMutation.isPending}
              onClick={() => handleAdjust(-1)}
              title="خصم"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>
          <Input
            placeholder="سبب التعديل (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        )}

        <div className="flex flex-col gap-2">
          <Label>سجل الحركات</Label>
          <div className="max-h-56 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-line)]">
            {isLoading && <p className="p-4 text-center text-sm text-[var(--color-ink-soft)]">جارِ التحميل...</p>}
            {!isLoading && data?.transactions.length === 0 && (
              <p className="p-4 text-center text-sm text-[var(--color-ink-soft)]">ما في حركات بعد</p>
            )}
            {data?.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-3 py-2 text-sm last:border-0"
              >
                <div>
                  <p className="text-[var(--color-ink)]">{t.description ?? t.type}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">{formatDateTime(t.created_at)}</p>
                </div>
                <span
                  className={`tabular font-medium ${t.points >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}
                >
                  {t.points >= 0 ? "+" : ""}
                  {t.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
