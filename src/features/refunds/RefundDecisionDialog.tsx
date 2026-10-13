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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import type { Refund } from "@/types/models";

export function RefundDecisionDialog({
  refund,
  action,
  onOpenChange,
  onConfirm,
  loading,
}: {
  refund: Refund | null;
  action: "approve" | "reject" | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (adminNote: string) => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (refund) setNote("");
  }, [refund]);

  const open = !!refund && !!action;
  const isApprove = action === "approve";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isApprove ? "الموافقة على الاسترجاع" : "رفض طلب الاسترجاع"}</DialogTitle>
          <DialogDescription>
            {refund && (
              <>
                طلب استرجاع بقيمة {formatCurrency(refund.amount)} للطلب {refund.order?.order_number ?? refund.order_id}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="admin_note">ملاحظة (اختياري)</Label>
          <Textarea
            id="admin_note"
            rows={3}
            placeholder={isApprove ? "ملاحظة على الموافقة..." : "سبب الرفض..."}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant={isApprove ? "default" : "danger"}
            disabled={loading}
            onClick={() => onConfirm(note)}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isApprove ? "تأكيد الموافقة" : "تأكيد الرفض"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>
              إلغاء
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
