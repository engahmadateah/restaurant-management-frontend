import { useState } from "react";
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
import type { MenuItem } from "@/types/models";

export function RestockDialog({
  item,
  onOpenChange,
  onConfirm,
  submitting,
}: {
  item: MenuItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (quantity: number) => void;
  submitting: boolean;
}) {
  const [quantity, setQuantity] = useState("");

  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) setQuantity("");
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>تزويد المخزون — {item?.name}</DialogTitle>
          <DialogDescription>
            الكمية الحالية: {item?.stock_quantity ?? 0}. أدخل الكمية الجديدة يلي وصلت.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">الكمية المضافة</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button
            disabled={submitting || !quantity || Number(quantity) <= 0}
            onClick={() => onConfirm(Number(quantity))}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            تأكيد
          </Button>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
