import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import type { MenuItem } from "@/types/models";
import type { InventorySettingsPayload } from "@/api/inventory";

export function InventorySettingsDialog({
  item,
  onOpenChange,
  onConfirm,
  submitting,
}: {
  item: MenuItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: InventorySettingsPayload) => void;
  submitting: boolean;
}) {
  const [trackStock, setTrackStock] = useState(false);
  const [quantity, setQuantity] = useState("0");
  const [threshold, setThreshold] = useState("0");

  useEffect(() => {
    if (item) {
      setTrackStock(item.track_stock);
      setQuantity(String(item.stock_quantity ?? 0));
      setThreshold(String(item.low_stock_threshold ?? 0));
    }
  }, [item]);

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>إعدادات المخزون — {item?.name}</DialogTitle>
          <DialogDescription>فعّل تتبع المخزون وحدّد كمية التنبيه للمخزون المنخفض</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2.5">
            <Label htmlFor="track_stock" className="cursor-pointer">
              تتبّع المخزون لهاد الصنف
            </Label>
            <Switch id="track_stock" checked={trackStock} onCheckedChange={setTrackStock} />
          </div>

          {trackStock && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stock_quantity">الكمية الحالية</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="low_stock_threshold">حد التنبيه للمخزون المنخفض</Label>
                <Input
                  id="low_stock_threshold"
                  type="number"
                  min="0"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            disabled={submitting}
            onClick={() =>
         
              onConfirm(
                trackStock
                  ? {
                      track_stock: true,
                      stock_quantity: Math.max(0, Math.trunc(Number(quantity) || 0)),
                      low_stock_threshold: Math.max(0, Math.trunc(Number(threshold) || 0)),
                    }
                  : { track_stock: false }
              )
            }
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            حفظ
          </Button>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
