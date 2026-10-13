import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueries, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { categoriesApi } from "@/api/categories";
import { menuItemsApi } from "@/api/menuItems";
import { modifierGroupsApi } from "@/api/modifierGroups";
import { tablesApi } from "@/api/tables";
import { customersApi } from "@/api/customers";
import { couponsApi } from "@/api/coupons";
import { ordersApi, type OrderPayload } from "@/api/orders";
import { paymentsApi } from "@/api/payments";
import { CashPaymentDialog } from "@/features/payments/CashPaymentDialog";
import { createIdempotencyKeeper } from "@/lib/idempotency";
import { cashDrawersApi } from "@/api/cashDrawers";
import { buildQueuedOrder, classifyError, OfflineSaveError } from "@/lib/offlineQueue";
import { useOfflineQueue } from "@/stores/offlineQueueStore";
import { useAuthStore } from "@/stores/authStore";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency } from "@/lib/format";
import { usePrintInvoice } from "@/hooks/usePrintInvoice";
import { getApiErrorMessage } from "@/api/client";
import type { MenuItem, ModifierGroup, Order, OrderType, PaymentMethod } from "@/types/models";
import { PosMenuGrid } from "./PosMenuGrid";
import { PosCartPanel, type CouponCheckStatus } from "./PosCartPanel";
import { PosModifierDialog } from "./PosModifierDialog";
import { PosQueuedOrderCard } from "./PosQueuedOrderCard";
import type { CartLine, CartLineModifier } from "./types";


function modifiersSignature(modifiers: CartLineModifier[]): string {
  return modifiers
    .map((m) => m.id)
    .sort((a, b) => a - b)
    .join(",");
}


const ORDER_TIMEOUT_MS = 15_000;

export default function PosPage() {
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine_in");
  const [tableId, setTableId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState<CouponCheckStatus>({ state: "idle" });
  const [notes, setNotes] = useState("");
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [cashOrder, setCashOrder] = useState<Order | null>(null);

  const [queuedId, setQueuedId] = useState<string | null>(null);
  const userId = useAuthStore((s) => s.user?.id);


  const hasDrawerAccess = usePermissions().hasAnyPermission(["drawer.manage_own", "drawer.manage_all"]);
  const { data: drawer, isSuccess: drawerLoaded } = useQuery({
    queryKey: ["cash-drawer", "current"],
    queryFn: cashDrawersApi.current,
    enabled: hasDrawerAccess,
    staleTime: 60_000,
  });
  
  const orderKeeper = useRef(createIdempotencyKeeper()).current;
  const payKeeper = useRef(createIdempotencyKeeper()).current;
  const [modifierPickerItem, setModifierPickerItem] = useState<MenuItem | null>(null);

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => categoriesApi.list() });
  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["menu-items", "available"],
    queryFn: () => menuItemsApi.list({ available_only: true }),
  });
  const { data: tables } = useQuery({ queryKey: ["tables"], queryFn: tablesApi.list });
  const { data: customers } = useQuery({ queryKey: ["customers", ""], queryFn: () => customersApi.list() });


  const modifierGroupsQueries = useQueries({
    queries: (menuItems ?? []).map((item) => ({
      queryKey: ["modifier-groups", item.id],
      queryFn: () => modifierGroupsApi.list(item.id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const modifierGroupsByItem = useMemo(() => {
    const map = new Map<number, ModifierGroup[]>();
    (menuItems ?? []).forEach((item, idx) => {
      const data = modifierGroupsQueries[idx]?.data;
      if (data) map.set(item.id, data);
    });
    return map;
  }, [menuItems, modifierGroupsQueries]);

  function resetForm() {
    setCart([]);
    setOrderType("dine_in");
    setTableId("");
    setCustomerId("");
    setRedeemPoints("");
    setDeliveryAddress("");
    setDeliveryPhone("");
    setCouponCode("");
    setCouponStatus({ state: "idle" });
    setNotes("");
    setLastOrder(null);
    setQueuedId(null);
  }

  function addToCart(item: MenuItem, modifiers: CartLineModifier[]) {
    const signature = modifiersSignature(modifiers);
    const unitPrice = Number(item.price) + modifiers.reduce((sum, m) => sum + m.extra_price, 0);

    setCart((prev) => {
      const existing = prev.find(
        (l) => l.menu_item_id === item.id && modifiersSignature(l.modifiers) === signature
      );
      if (existing) {
        return prev.map((l) => (l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          menu_item_id: item.id,
          name: item.name,
          price: unitPrice,
          quantity: 1,
          modifiers,
        },
      ];
    });
  }

  function handleAddClick(item: MenuItem) {
    const groups = modifierGroupsByItem.get(item.id);
    if (groups && groups.length > 0) {
      setModifierPickerItem(item);
    } else {
      addToCart(item, []);
    }
  }

  function handleIncrement(key: string) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l)));
  }

  function handleDecrement(key: string) {
    setCart((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity - 1 } : l))
        .filter((l) => l.quantity > 0)
    );
  }

  function handleRemove(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
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

  const subtotal = cart.reduce((sum, l) => sum + l.price * l.quantity, 0);

  
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmitRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const createMutation = useMutation({
    mutationFn: async (payload: OrderPayload) => {
      const key = orderKeeper.keyFor(payload);
      try {
        return { order: await ordersApi.create(payload, key, { timeoutMs: ORDER_TIMEOUT_MS }), queuedId: null };
      } catch (err) {
        if (classifyError(err) !== "offline" || !userId) throw err;

        const entry = buildQueuedOrder({ userId, payload, orderKey: key, estimatedSubtotal: subtotal });
        if (!useOfflineQueue.getState().enqueue(entry)) throw new OfflineSaveError();
        return { order: null, queuedId: entry.id };
      }
    },
    onSuccess: ({ order, queuedId: queued }) => {
      orderKeeper.reset();
      if (order) {
        toast.success("تم إنشاء الطلب رقم " + order.order_number);
        setLastOrder(order);
      } else if (queued) {
        toast.warning("ما في اتصال بالسيرفر: انحفظ الطلب على الجهاز وبينبعت تلقائياً");
        setQueuedId(queued);
      }
    },
    onError: (err) => toast.error(err instanceof OfflineSaveError ? err.message : getApiErrorMessage(err)),
  });

  const printMutation = usePrintInvoice();

  const payMutation = useMutation({
    mutationFn: ({ order, method, tendered }: { order: Order; method: PaymentMethod; tendered?: number }) => {
      const payload = {
        order_id: order.id,
        method,
        amount: Number(order.total),
        ...(tendered !== undefined ? { tendered_amount: tendered } : {}),
      };
      return paymentsApi.create(payload, payKeeper.keyFor(payload));
    },
    onSuccess: (payment, { order }) => {
      payKeeper.reset();
      const change = Number(payment.change_amount ?? 0);
      toast.success(change > 0 ? `تم تسجيل الدفعة — الباقي للزبون ${formatCurrency(change)}` : "تم تسجيل الدفعة");
      setCashOrder(null);
      setLastOrder({ ...order, payment_status: "paid" });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleSubmit() {
    if (cart.length === 0 || lastOrder || queuedId || createMutation.isPending) return;
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      toast.error("اكتب عنوان التوصيل أول");
      return;
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
      items: cart.map((l) => ({
        menu_item_id: l.menu_item_id,
        quantity: l.quantity,
        modifiers: l.modifiers.length > 0 ? l.modifiers.map((m) => m.id) : undefined,
      })),
    };

    createMutation.mutate(payload);
  }

  const handleSubmitRef = useRef<() => void>(() => {});
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الكاشير (POS)" description="اختر الأصناف وأنشئ طلب جديد بسرعة" />

      {hasDrawerAccess && drawerLoaded && !drawer && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] px-4 py-2.5 text-sm text-[var(--color-warning)]">
          <span>ما عندك صندوق مفتوح — المبيعات النقدية ما رح تنحسب بجرد الصندوق.</span>
          <Link to="/cash-drawer" className="shrink-0 font-semibold underline">
            افتح الصندوق
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <PosMenuGrid
          categories={categories}
          items={menuItems}
          isLoading={itemsLoading}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onAdd={handleAddClick}
        />

        <div className="w-full lg:w-[380px] lg:shrink-0">
          {queuedId ? (
            <PosQueuedOrderCard entryId={queuedId} onNewOrder={resetForm} />
          ) : (
            <PosCartPanel
              cart={cart}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onRemove={handleRemove}
              orderType={orderType}
              onOrderTypeChange={setOrderType}
              tables={tables}
              tableId={tableId}
              onTableChange={setTableId}
              customers={customers}
              customerId={customerId}
              onCustomerChange={setCustomerId}
              redeemPoints={redeemPoints}
              onRedeemPointsChange={setRedeemPoints}
              deliveryAddress={deliveryAddress}
              onDeliveryAddressChange={setDeliveryAddress}
              deliveryPhone={deliveryPhone}
              onDeliveryPhoneChange={setDeliveryPhone}
              couponCode={couponCode}
              onCouponCodeChange={handleCouponCodeChange}
              couponStatus={couponStatus}
              onValidateCoupon={handleValidateCoupon}
              notes={notes}
              onNotesChange={setNotes}
              subtotal={subtotal}
              onSubmit={handleSubmit}
              submitting={createMutation.isPending}
              lastOrder={lastOrder}
              onPrint={() => lastOrder && printMutation.mutate(lastOrder.id)}
              printing={printMutation.isPending}
              onNewOrder={resetForm}
              onPay={(method) => {
                if (!lastOrder) return;
                if (method === "cash") setCashOrder(lastOrder);
                else payMutation.mutate({ order: lastOrder, method });
              }}
              paying={payMutation.isPending}
              onClear={() => setCart([])}
            />
          )}
        </div>
      </div>

      <PosModifierDialog
        open={!!modifierPickerItem}
        onOpenChange={(open) => !open && setModifierPickerItem(null)}
        item={modifierPickerItem}
        groups={modifierPickerItem ? modifierGroupsByItem.get(modifierPickerItem.id) : undefined}
        onConfirm={(modifiers) => {
          if (modifierPickerItem) addToCart(modifierPickerItem, modifiers);
          setModifierPickerItem(null);
        }}
      />

      <CashPaymentDialog
        open={!!cashOrder}
        onOpenChange={(open) => !open && setCashOrder(null)}
        amount={cashOrder ? Number(cashOrder.total) : 0}
        description={cashOrder ? `الطلب ${cashOrder.order_number}` : undefined}
        pending={payMutation.isPending}
        onConfirm={(tendered) => cashOrder && payMutation.mutate({ order: cashOrder, method: "cash", tendered })}
      />
    </div>
  );
}
