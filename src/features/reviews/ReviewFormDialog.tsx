import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { menuItemsApi } from "@/api/menuItems";
import { customersApi } from "@/api/customers";
import { cn } from "@/lib/utils";
import type { Review } from "@/types/models";
import type { ReviewCreatePayload, ReviewUpdatePayload } from "@/api/reviews";

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5">
          <Star
            className={cn(
              "h-6 w-6",
              n <= value ? "fill-[var(--color-gold-500)] text-[var(--color-gold-500)]" : "text-[var(--color-line)]"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewFormDialog({
  open,
  onOpenChange,
  review,
  onSubmitCreate,
  onSubmitUpdate,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review?: Review | null;
  onSubmitCreate: (payload: ReviewCreatePayload) => void;
  onSubmitUpdate: (id: number, payload: ReviewUpdatePayload) => void;
  submitting: boolean;
}) {
  const [menuItemId, setMenuItemId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isApproved, setIsApproved] = useState(false);

  const { data: menuItems } = useQuery({
    queryKey: ["menu-items", "available"],
    queryFn: () => menuItemsApi.list({ available_only: true }),
    enabled: open && !review,
  });
  const { data: customers } = useQuery({
    queryKey: ["customers", ""],
    queryFn: () => customersApi.list(),
    enabled: open && !review,
  });

  useEffect(() => {
    if (open) {
      if (review) {
        setRating(review.rating);
        setComment(review.comment ?? "");
        setIsApproved(review.is_approved);
      } else {
        setMenuItemId("");
        setCustomerId("");
        setRating(5);
        setComment("");
        setIsApproved(false);
      }
    }
  }, [open, review]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (review) {
      onSubmitUpdate(review.id, { rating, comment: comment || null, is_approved: isApproved });
    } else {
      if (!menuItemId) return;
      onSubmitCreate({
        menu_item_id: Number(menuItemId),
        customer_id: customerId ? Number(customerId) : null,
        rating,
        comment: comment || null,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{review ? "تعديل تقييم" : "تقييم جديد"}</DialogTitle>
          <DialogDescription>
            {review
              ? "عدّل التقييم أو التعليق، أو غيّر حالة النشر"
              : "سجّل تقييم زبون (متلاً تقييم وصلك تلفونيًا أو حضوريًا)"}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={submit}>
          {review ? (
            <div className="rounded-[var(--radius-sm)] bg-[var(--color-wine-50)] px-3 py-2 text-sm">
              <p className="font-medium text-[var(--color-ink)]">{review.menuItem?.name ?? "—"}</p>
              <p className="text-[var(--color-ink-soft)]">{review.customer?.name ?? "زبون غير مسجّل"}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>الصنف</Label>
                <Select value={menuItemId} onValueChange={setMenuItemId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر صنف" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems?.map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>الزبون (اختياري)</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="بدون زبون مسجّل" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name} — {c.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>التقييم</Label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comment">التعليق (اختياري)</Label>
            <Textarea id="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>

          {review && (
            <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-line)] px-3 py-2">
              <Label htmlFor="is_approved" className="cursor-pointer">
                منشور (ظاهر للعموم)
              </Label>
              <Switch id="is_approved" checked={isApproved} onCheckedChange={setIsApproved} />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting || (!review && !menuItemId)}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {review ? "حفظ التعديلات" : "إضافة"}
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
