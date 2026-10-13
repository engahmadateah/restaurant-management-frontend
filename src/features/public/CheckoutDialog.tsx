import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { createIdempotencyKeeper } from "@/lib/idempotency";
import { publicOrderingApi, type PublicInfo, type PublicOrderPayload, type PublicOrderType } from "@/api/publicOrdering";
import type { useCart } from "./useCart";
import { fromCents, publicErrorMessage, readContact, saveContact, saveLastOrder, toCents } from "./publicUtils";

const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;

type Cart = ReturnType<typeof useCart>;

export function CheckoutDialog({
  open,
  onOpenChange,
  cart,
  info,
  mode,
  tableToken,
  menuPath,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: Cart;
  info: PublicInfo;
  mode: "table" | "online";
  tableToken: string;
  menuPath: string;
}) {
  const navigate = useNavigate();
  const keeper = useRef(createIdempotencyKeeper()).current;
  const [orderType, setOrderType] = useState<PublicOrderType>(mode === "table" ? "dine_in" : "takeaway");
  const [contact, setContact] = useState(readContact);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) setContact(readContact());
  }, [open]);

  const delivery = mode === "online" && orderType === "delivery";
  const subtotalC = toCents(cart.subtotal);
  const taxC = toCents(cart.tax);
  const deliveryC = delivery ? toCents(info.delivery_fee) : 0;
  const totalC = subtotalC + taxC + deliveryC;
  const belowMin = mode === "online" && info.online_min_order > 0 && cart.subtotal < info.online_min_order;

  const needsContact = mode === "online";
  const contactError =
    needsContact && contact.name.trim().length < 2
      ? "اكتب اسمك"
      : needsContact && !PHONE_RE.test(contact.phone.trim())
        ? "رقم الهاتف غير صحيح"
        : delivery && contact.address.trim().length < 5
          ? "اكتب عنوان التوصيل"
          : null;

  const mutation = useMutation({
    mutationFn: () => {
      const core: Omit<PublicOrderPayload, "client_request_id"> = {
        order_type: orderType,
        ...(mode === "table" ? { table_token: tableToken } : {}),
        ...(needsContact ? { customer_name: contact.name.trim(), customer_phone: contact.phone.trim() } : {}),
        ...(delivery ? { delivery_address: contact.address.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        items: cart.lines.map((l) => ({
          menu_item_id: l.menuItemId,
          quantity: l.quantity,
          ...(l.notes ? { notes: l.notes } : {}),
          ...(l.modifierIds.length ? { modifiers: l.modifierIds } : {}),
        })),
      };
      return publicOrderingApi.createOrder({ client_request_id: keeper.keyFor(core), ...core });
    },
    onSuccess: (order) => {
      keeper.reset();
      if (needsContact) saveContact(contact);
      saveLastOrder({ token: order.token, menuPath });
      cart.clear();
      setNotes("");
      onOpenChange(false);
      navigate(`/track/${order.token}`);
    },
    onError: (err) => toast.error(publicErrorMessage(err)),
  });

  const disabled = mutation.isPending || cart.lines.length === 0 || belowMin || !!contactError;

  return (
    <Dialog open={open} onOpenChange={(o) => !mutation.isPending && onOpenChange(o)}>
      <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>تأكيد الطلب</DialogTitle>
          <DialogDescription>{mode === "table" ? "رح يوصل الطلب للمطبخ مباشرة" : "الدفع كاش عند الاستلام أو التوصيل"}</DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col divide-y divide-[var(--color-line)]">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{l.name}</p>
                {l.modifierNames.length > 0 && <p className="text-xs text-[var(--color-ink-soft)]">{l.modifierNames.join("، ")}</p>}
                {l.notes && <p className="text-xs text-[var(--color-ink-soft)]">ملاحظة: {l.notes}</p>}
                <p className="tabular mt-0.5 text-xs text-[var(--color-ink-soft)]">{formatCurrency(l.unitPrice, info.currency)}</p>
              </div>
              <div className="flex items-center gap-1 rounded-full border border-[var(--color-line)]">
                <Button type="button" variant="ghost" size="icon" aria-label="أنقص" onClick={() => cart.setQuantity(l.key, l.quantity - 1)}>
                  <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="tabular w-5 text-center">{l.quantity}</span>
                <Button type="button" variant="ghost" size="icon" aria-label="زيّد" onClick={() => cart.setQuantity(l.key, l.quantity + 1)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        {mode === "online" && (
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="طريقة الاستلام">
            {(["takeaway", "delivery"] as const).map((t) => (
              <Button key={t} type="button" role="radio" aria-checked={orderType === t} variant={orderType === t ? "default" : "outline"} onClick={() => setOrderType(t)}>
                {t === "takeaway" ? "استلام من المطعم" : "توصيل"}
              </Button>
            ))}
          </div>
        )}

        {needsContact && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-name">الاسم</Label>
              <Input id="c-name" autoComplete="name" maxLength={100} value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-phone">رقم الهاتف</Label>
              <Input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" className="text-start" maxLength={20} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </div>
            {delivery && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="c-address">عنوان التوصيل</Label>
                <Textarea id="c-address" rows={2} maxLength={255} autoComplete="street-address" value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="c-notes">ملاحظات على الطلب (اختياري)</Label>
          <Textarea id="c-notes" rows={2} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <dl className="flex flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-wine-50)] px-4 py-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[var(--color-ink-soft)]">المجموع</dt>
            <dd className="tabular">{formatCurrency(fromCents(subtotalC), info.currency)}</dd>
          </div>
          {taxC > 0 && (
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">الضريبة (تقديري)</dt>
              <dd className="tabular">{formatCurrency(fromCents(taxC), info.currency)}</dd>
            </div>
          )}
          {delivery && (
            <div className="flex justify-between">
              <dt className="text-[var(--color-ink-soft)]">أجرة التوصيل</dt>
              <dd className="tabular">{formatCurrency(fromCents(deliveryC), info.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-[var(--color-line)] pt-1.5 text-base font-semibold">
            <dt>الإجمالي (تقديري)</dt>
            <dd className="tabular">{formatCurrency(fromCents(totalC), info.currency)}</dd>
          </div>
          <p className="text-xs text-[var(--color-ink-soft)]">الإجمالي النهائي بيظهر بعد الإرسال.</p>
        </dl>

        {belowMin && (
          <p className="text-sm text-[var(--color-danger)]">الحد الأدنى للطلب {formatCurrency(info.online_min_order, info.currency)}</p>
        )}
        {!belowMin && contactError && cart.lines.length > 0 && <p className="text-sm text-[var(--color-ink-soft)]">{contactError}</p>}

        <Button type="button" size="lg" disabled={disabled} onClick={() => mutation.mutate()}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {mutation.isPending ? "جارِ الإرسال..." : "إرسال الطلب"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
