import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, BadgeCheck, XCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { menuItemsApi } from "@/api/menuItems";
import { modifierGroupsApi } from "@/api/modifierGroups";
import { customersApi } from "@/api/customers";
import { tablesApi } from "@/api/tables";
import { couponsApi } from "@/api/coupons";
import { getApiErrorMessage } from "@/api/client";
import { validateModifierSelection } from "@/lib/modifierRules";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import type { Coupon, ModifierGroup, OrderType } from "@/types/models";
import type { OrderItemPayload, OrderPayload } from "@/api/orders";

interface DraftLine {
  key: string;
  menu_item_id: number | undefined;
  quantity: number;
  
  modifiers: number[];
 
  modifiersExtra: number;
}

type CouponCheckStatus =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "valid"; coupon: Coupon }
  | { state: "invalid"; message: string };

function emptyLine(): DraftLine {
  return { key: crypto.randomUUID(), menu_item_id: undefined, quantity: 1, modifiers: [], modifiersExtra: 0 };
}


function OrderLineRow({
  line,
  menuItems,
  onChange,
  onRemove,
  removeDisabled,
}: {
  line: DraftLine;
  menuItems: { id: number; name: string; price: string }[] | undefined;
  onChange: (patch: Partial<DraftLine>) => void;
  onRemove: () => void;
  removeDisabled: boolean;
}) {
  const { data: groups } = useQuery({
    queryKey: ["modifier-groups", line.menu_item_id],
    queryFn: () => modifierGroupsApi.list(line.menu_item_id!),
    enabled: !!line.menu_item_id,
  });

  function toggleModifier(groupId: number, modifierId: number, maxSelections: number) {
    const groupModifierIds = new Set(
      (groups?.find((g) => g.id === groupId)?.modifiers ?? []).map((m) => m.id)
    );
    const otherGroupsSelected = line.modifiers.filter((id) => !groupModifierIds.has(id));
    const thisGroupSelected = line.modifiers.filter((id) => groupModifierIds.has(id));

    let nextThisGroup: number[];
    if (thisGroupSelected.includes(modifierId)) {
      nextThisGroup = thisGroupSelected.filter((id) => id !== modifierId);
    } else if (maxSelections === 1) {
      nextThisGroup = [modifierId];
    } else {
      nextThisGroup = [...thisGroupSelected, modifierId];
    }

    const nextModifiers = [...otherGroupsSelected, ...nextThisGroup];
    const extraMap = new Map<number, number>();
    groups?.forEach((g) => g.modifiers?.forEach((m) => extraMap.set(m.id, Number(m.extra_price))));
    const nextExtra = nextModifiers.reduce((sum, id) => sum + (extraMap.get(id) ?? 0), 0);

    onChange({ modifiers: nextModifiers, modifiersExtra: nextExtra });
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--color-line)] p-2.5">
      <div className="flex items-center gap-2">
        <Select
          value={line.menu_item_id ? String(line.menu_item_id) : undefined}
          onValueChange={(v) => onChange({ menu_item_id: Number(v), modifiers: [], modifiersExtra: 0 })}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="اختر صنف" />
          </SelectTrigger>
          <SelectContent>
            {menuItems?.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name} — {formatCurrency(m.price)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min="1"
          value={line.quantity}
          onChange={(e) => onChange({ quantity: Math.max(1, Number(e.target.value)) })}
          className="w-20"
        />
        <Button type="button" variant="ghost" size="icon" onClick={onRemove} disabled={removeDisabled}>
          <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
        </Button>
      </div>

      {!!line.menu_item_id && groups && groups.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-[var(--color-line)] pt-2">
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-1">
              <p className="text-xs font-medium text-[var(--color-ink-soft)]">
                {group.name}
                {group.is_required && <span className="text-[var(--color-danger)]"> *</span>}{" "}
                <span className="font-normal">
                  ({group.max_selections === 1 ? "اختيار واحد" : `حتى ${group.max_selections}`})
                </span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {group.modifiers?.map((modifier) => {
                  const checked = line.modifiers.includes(modifier.id);
                  const thisGroupCount = (group.modifiers ?? []).filter((m) =>
                    line.modifiers.includes(m.id)
                  ).length;
                  const atMax = group.max_selections > 0 && thisGroupCount >= group.max_selections;
                  const disabled = (!checked && atMax && group.max_selections !== 1) || !modifier.is_available;
                  return (
                    <label key={modifier.id} className="flex items-center gap-1.5 text-xs text-[var(--color-ink)]">
                      <Checkbox
                        checked={checked}
                        disabled={disabled}
                        onCheckedChange={() => toggleModifier(group.id, modifier.id, group.max_selections)}
                      />
                      {modifier.name}
                      {Number(modifier.extra_price) > 0 && (
                        <span className="tabular text-[var(--color-ink-soft)]">
                          (+{formatCurrency(modifier.extra_price)})
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrderFormDialog({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: OrderPayload) => void;
  submitting: boolean;
}) {
  const queryClient = useQueryClient();
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [tableId, setTableId] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<CouponCheckStatus>({ state: "idle" });
  const [redeemPoints, setRedeemPoints] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);

  const { data: menuItems } = useQuery({
    queryKey: ["menu-items", "available"],
    queryFn: () => menuItemsApi.list({ available_only: true }),
    enabled: open,
  });
  const { data: tables } = useQuery({ queryKey: ["tables"], queryFn: tablesApi.list, enabled: open });
  const { data: customers } = useQuery({ queryKey: ["customers", ""], queryFn: () => customersApi.list(), enabled: open });

  useEffect(() => {
    if (open) {
      setOrderType("dine_in");
      setTableId("");
      setCustomerId("");
      setDeliveryAddress("");
      setDeliveryPhone("");
      setCouponCode("");
      setCouponStatus({ state: "idle" });
      setRedeemPoints("");
      setNotes("");
      setLines([emptyLine()]);
    }
  }, [open]);

  const selectedCustomer = customers?.find((c) => String(c.id) === customerId);

  const subtotal = lines.reduce((sum, line) => {
    const item = menuItems?.find((m) => m.id === line.menu_item_id);
    if (!item) return sum;
    return sum + (Number(item.price) + line.modifiersExtra) * line.quantity;
  }, 0);

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function handleCouponCodeChange(value: string) {
    setCouponCode(value);
    if (couponStatus.state !== "idle") setCouponStatus({ state: "idle" });
  }

  const validateCouponMutation = useMutation({
    mutationFn: (code: string) => couponsApi.validate(code),
    onMutate: () => setCouponStatus({ state: "checking" }),
    onSuccess: (coupon) => setCouponStatus({ state: "valid", coupon }),
    onError: (err) => setCouponStatus({ state: "invalid", message: getApiErrorMessage(err) }),
  });

  function handleValidateCoupon() {
    if (!couponCode.trim()) return;
    validateCouponMutation.mutate(couponCode.trim());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const items: OrderItemPayload[] = lines
      .filter((l) => l.menu_item_id)
      .map((l) => ({
        menu_item_id: l.menu_item_id!,
        quantity: l.quantity,
        modifiers: l.modifiers.length > 0 ? l.modifiers : undefined,
      }));

    if (items.length === 0) return;

   
    for (const line of lines.filter((l) => l.menu_item_id)) {
      const groups = queryClient.getQueryData<ModifierGroup[]>(["modifier-groups", line.menu_item_id]);
      const itemName = menuItems?.find((m) => m.id === line.menu_item_id)?.name;
      const problem = validateModifierSelection(groups, line.modifiers, itemName);
      if (problem) {
        toast.error(problem);
        return;
      }
    }

    const payload: OrderPayload = {
      order_type: orderType,
      table_id: orderType === "dine_in" && tableId ? Number(tableId) : null,
      customer_id: customerId ? Number(customerId) : null,
      coupon_code: couponCode || undefined,
      delivery_address: orderType === "delivery" ? deliveryAddress : undefined,
      delivery_phone: orderType === "delivery" ? deliveryPhone : undefined,
      redeem_points: redeemPoints ? Number(redeemPoints) : undefined,
      notes: notes || undefined,
      items,
    };

    onSubmit(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>طلب جديد</DialogTitle>
          <DialogDescription>أنشئ طلب جديد واختر الأصناف المطلوبة</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>نوع الطلب</Label>
              <Select value={orderType} onValueChange={(v) => setOrderType(v as OrderType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine_in">صالة (Dine-in)</SelectItem>
                  <SelectItem value="takeaway">استلام (Takeaway)</SelectItem>
                  <SelectItem value="delivery">توصيل (Delivery)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {orderType === "dine_in" && (
              <div className="flex flex-col gap-1.5">
                <Label>الطاولة (اختياري)</Label>
                <Select value={tableId} onValueChange={setTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="بدون طاولة" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables?.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        طاولة {t.table_number} ({t.capacity} أشخاص)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>الزبون (اختياري)</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
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
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="redeem">استبدال نقاط ولاء (من {selectedCustomer.loyalty_points})</Label>
                <Input
                  id="redeem"
                  type="number"
                  min="0"
                  max={selectedCustomer.loyalty_points}
                  value={redeemPoints}
                  onChange={(e) => setRedeemPoints(e.target.value)}
                />
              </div>
            )}

            {orderType === "delivery" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deliveryAddress">عنوان التوصيل</Label>
                  <Input
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deliveryPhone">هاتف التواصل</Label>
                  <Input id="deliveryPhone" value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} />
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="coupon">كود الكوبون (اختياري)</Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  className="flex-1"
                  value={couponCode}
                  onChange={(e) => handleCouponCodeChange(e.target.value.toUpperCase())}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidateCoupon}
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

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>الأصناف</Label>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="h-4 w-4" />
                إضافة صنف
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {lines.map((line) => (
                <OrderLineRow
                  key={line.key}
                  line={line}
                  menuItems={menuItems}
                  onChange={(patch) => updateLine(line.key, patch)}
                  onRemove={() => removeLine(line.key)}
                  removeDisabled={lines.length === 1}
                />
              ))}
            </div>

            <div className="flex justify-between rounded-[var(--radius-sm)] bg-[var(--color-wine-50)] px-3 py-2 text-sm">
              <span className="text-[var(--color-ink-soft)]">المجموع الفرعي (تقريبي، قبل الضريبة والخصم)</span>
              <span className="tabular font-medium">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting || !lines.some((l) => l.menu_item_id)}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              إنشاء الطلب
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
