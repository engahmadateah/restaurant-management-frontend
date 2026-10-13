import { Minus, Plus, Trash2, ShoppingCart, Printer, CheckCircle2, RotateCcw, Loader2, BadgeCheck, XCircle, Banknote, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import type { Coupon, Customer, Order, OrderType, PaymentMethod, RestaurantTable } from "@/types/models";
import type { CartLine } from "./types";

export type CouponCheckStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; coupon: Coupon }
  | { state: "invalid"; message: string };

const ORDER_TYPE_OPTIONS: { value: OrderType; label: string }[] = [
  { value: "dine_in", label: "صالة" },
  { value: "takeaway", label: "استلام" },
  { value: "delivery", label: "توصيل" },
];

interface PosCartPanelProps {
  cart: CartLine[];
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
  orderType: OrderType;
  onOrderTypeChange: (v: OrderType) => void;
  tables?: RestaurantTable[];
  tableId: string;
  onTableChange: (v: string) => void;
  customers?: Customer[];
  customerId: string;
  onCustomerChange: (v: string) => void;
  redeemPoints: string;
  onRedeemPointsChange: (v: string) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (v: string) => void;
  deliveryPhone: string;
  onDeliveryPhoneChange: (v: string) => void;
  couponCode: string;
  onCouponCodeChange: (v: string) => void;
  couponStatus: CouponCheckStatus;
  onValidateCoupon: () => void;
  notes: string;
  onNotesChange: (v: string) => void;
  subtotal: number;
  onSubmit: () => void;
  submitting: boolean;
  lastOrder: Order | null;
  onPrint: () => void;
  printing: boolean;
  onNewOrder: () => void;
  onPay: (method: PaymentMethod) => void;
  paying: boolean;
  onClear: () => void;
}

export function PosCartPanel({
  cart,
  onIncrement,
  onDecrement,
  onRemove,
  orderType,
  onOrderTypeChange,
  tables,
  tableId,
  onTableChange,
  customers,
  customerId,
  onCustomerChange,
  redeemPoints,
  onRedeemPointsChange,
  deliveryAddress,
  onDeliveryAddressChange,
  deliveryPhone,
  onDeliveryPhoneChange,
  couponCode,
  onCouponCodeChange,
  couponStatus,
  onValidateCoupon,
  notes,
  onNotesChange,
  subtotal,
  onSubmit,
  submitting,
  lastOrder,
  onPrint,
  printing,
  onNewOrder,
  onPay,
  paying,
  onClear,
}: PosCartPanelProps) {
  const selectedCustomer = customers?.find((c) => String(c.id) === customerId);

  if (lastOrder) {
    return (
      <Card className="flex h-fit flex-col items-center gap-4 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-bg)]">
          <CheckCircle2 className="h-7 w-7 text-[var(--color-success)]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-ink)]">تم إنشاء الطلب بنجاح</h3>
          <p className="tabular text-sm text-[var(--color-ink-soft)]">{lastOrder.order_number}</p>
        </div>
        <div className="w-full rounded-[var(--radius-sm)] bg-[var(--color-wine-50)] px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--color-ink-soft)]">الإجمالي</span>
            <span className="tabular font-semibold">{formatCurrency(lastOrder.total)}</span>
          </div>
        </div>
        {lastOrder.payment_status === "paid" ? (
          <div className="flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-success-bg)] px-4 py-2 text-sm font-medium text-[var(--color-success)]">
            <BadgeCheck className="h-4 w-4" />
            تم الدفع
          </div>
        ) : (
          Number(lastOrder.total) > 0 && (
            <div className="flex w-full gap-2">
              <Button className="flex-1" variant="gold" disabled={paying} onClick={() => onPay("cash")}>
                {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                دفع نقدي
              </Button>
              <Button className="flex-1" variant="outline" disabled={paying} onClick={() => onPay("card")}>
                <CreditCard className="h-4 w-4" />
                بطاقة
              </Button>
            </div>
          )
        )}
        <div className="flex w-full flex-col gap-2">
          <Button onClick={onNewOrder}>
            <RotateCcw className="h-4 w-4" />
            طلب جديد
          </Button>
          <Button variant="outline" onClick={onPrint} disabled={printing}>
            <Printer className="h-4 w-4" />
            طباعة الفاتورة
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex h-fit flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          الطلب الحالي
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="tabular text-xs text-[var(--color-ink-soft)]">
            {cart.reduce((n, l) => n + l.quantity, 0)} صنف
          </span>
          {cart.length > 0 && (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[var(--color-danger)]" onClick={onClear}>
              <Trash2 className="h-3.5 w-3.5" />
              تفريغ
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>نوع الطلب</Label>
          <Select value={orderType} onValueChange={(v) => onOrderTypeChange(v as OrderType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ORDER_TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {orderType === "dine_in" && (
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>الطاولة (اختياري)</Label>
            <Select value={tableId} onValueChange={onTableChange}>
              <SelectTrigger>
                <SelectValue placeholder="بدون طاولة" />
              </SelectTrigger>
              <SelectContent>
                {tables?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    طاولة {t.table_number} ({t.capacity} أشخاص){t.status === "occupied" ? " — مشغولة" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="col-span-2 flex flex-col gap-1.5">
          <Label>الزبون (اختياري)</Label>
          <Select value={customerId} onValueChange={onCustomerChange}>
            <SelectTrigger>
              <SelectValue placeholder="بدون زبون" />
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

        {selectedCustomer && selectedCustomer.loyalty_points > 0 && (
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="pos-redeem">استبدال نقاط ولاء (من {selectedCustomer.loyalty_points})</Label>
            <Input
              id="pos-redeem"
              type="number"
              min="0"
              max={selectedCustomer.loyalty_points}
              value={redeemPoints}
              onChange={(e) => onRedeemPointsChange(e.target.value)}
            />
          </div>
        )}

        {orderType === "delivery" && (
          <>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="pos-address">عنوان التوصيل</Label>
              <Input
                id="pos-address"
                value={deliveryAddress}
                onChange={(e) => onDeliveryAddressChange(e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="pos-phone">هاتف التواصل</Label>
              <Input id="pos-phone" value={deliveryPhone} onChange={(e) => onDeliveryPhoneChange(e.target.value)} />
            </div>
          </>
        )}

        <div className="col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="pos-coupon">كود الكوبون (اختياري)</Label>
          <div className="flex gap-2">
            <Input
              id="pos-coupon"
              className="flex-1"
              value={couponCode}
              onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onValidateCoupon}
              disabled={!couponCode.trim() || couponStatus.state === "checking"}
            >
              {couponStatus.state === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "تحقق"}
            </Button>
          </div>
          {couponStatus.state === "valid" && (
            <p className="flex items-center gap-1 text-xs text-[var(--color-success)]">
              <BadgeCheck className="h-3.5 w-3.5" />
              كوبون صالح — خصم{" "}
              {couponStatus.coupon.type === "percentage"
                ? `${couponStatus.coupon.value}%`
                : formatCurrency(couponStatus.coupon.value)}
            </p>
          )}
          {couponStatus.state === "invalid" && (
            <p className="flex items-center gap-1 text-xs text-[var(--color-danger)]">
              <XCircle className="h-3.5 w-3.5" />
              {couponStatus.message}
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto">
        {cart.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--color-ink-soft)]">السلة فاضية — اختر أصناف من القائمة</p>
        )}
        {cart.map((line) => (
          <div key={line.key} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-ink)]">{line.name}</p>
              {line.modifiers.length > 0 && (
                <p className="truncate text-xs text-[var(--color-ink-soft)]">
                  {line.modifiers.map((m) => m.name).join("، ")}
                </p>
              )}
              <p className="tabular text-xs text-[var(--color-ink-soft)]">{formatCurrency(line.price)}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => onDecrement(line.key)}>
                <Minus className="h-3 w-3" />
              </Button>
              <span className="tabular w-5 text-center text-sm">{line.quantity}</span>
              <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => onIncrement(line.key)}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(line.key)}>
              <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
            </Button>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pos-notes">ملاحظات (اختياري)</Label>
        <Textarea id="pos-notes" rows={2} value={notes} onChange={(e) => onNotesChange(e.target.value)} />
      </div>

      <div className="flex justify-between rounded-[var(--radius-sm)] bg-[var(--color-wine-50)] px-3 py-2 text-sm">
        <span className="text-[var(--color-ink-soft)]">المجموع الفرعي (قبل الضريبة والخصم)</span>
        <span className="tabular font-semibold">{formatCurrency(subtotal)}</span>
      </div>

      <Button
        size="lg"
        onClick={onSubmit}
        disabled={
          submitting ||
          cart.length === 0 ||
          (orderType === "delivery" && !deliveryAddress.trim())
        }
      >
        {submitting ? "جارِ التأكيد..." : "تأكيد الطلب"}
      </Button>
    </Card>
  );
}
