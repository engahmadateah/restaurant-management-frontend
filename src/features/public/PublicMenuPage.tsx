import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Armchair, Loader2, MapPin, Phone, QrCode, Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { publicOrderingApi, type PublicMenuItem } from "@/api/publicOrdering";
import { CheckoutDialog } from "./CheckoutDialog";
import { ItemDialog } from "./ItemDialog";
import { useCart, type CartLine } from "./useCart";
import { readLastOrder } from "./publicUtils";


export default function PublicMenuPage({ mode }: { mode: "table" | "online" }) {
  const { token = "" } = useParams();
  return <MenuScreen key={mode === "table" ? token : "online"} mode={mode} token={token} />;
}

function MenuScreen({ mode, token }: { mode: "table" | "online"; token: string }) {
  const menuPath = mode === "table" ? `/t/${token}` : "/order";
  const cart = useCart(mode === "table" ? `t:${token}` : "online");
  const [search, setSearch] = useState("");
  const [activeItem, setActiveItem] = useState<PublicMenuItem | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const info = useQuery({ queryKey: ["public", "info"], queryFn: publicOrderingApi.info, staleTime: 60_000 });
  const menu = useQuery({ queryKey: ["public", "menu"], queryFn: () => publicOrderingApi.menu(), staleTime: 30_000 });
  const table = useQuery({
    queryKey: ["public", "table", token],
    queryFn: () => publicOrderingApi.table(token),
    enabled: mode === "table",
    retry: false,
  });

  useEffect(() => {
    if (info.data?.restaurant_name) document.title = info.data.restaurant_name;
  }, [info.data?.restaurant_name]);

  const currency = info.data?.currency ?? "";
  const orderingEnabled =
    mode === "table" ? !!info.data?.qr_ordering_enabled && !!table.data : !!info.data?.online_ordering_enabled;
  const lastOrder = readLastOrder();

  const categories = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const all = menu.data ?? [];
    if (!needle) return all;
    return all
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => i.name.toLowerCase().includes(needle) || (i.description ?? "").toLowerCase().includes(needle)),
      }))
      .filter((c) => c.items.length > 0);
  }, [menu.data, search]);

  if (mode === "table" && table.isError) {
    return (
      <Centered>
        <QrCode className="h-10 w-10 text-[var(--color-ink-soft)]" />
        <h1 className="text-lg font-semibold">رمز الطاولة غير صالح</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">امسح الـ QR الموجود على الطاولة من جديد، أو اطلب من الموظف.</p>
      </Centered>
    );
  }

  if (menu.isError || info.isError) {
    return (
      <Centered>
        <h1 className="text-lg font-semibold">تعذّر تحميل القائمة</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">تأكد من الإنترنت وجرّب مرة تانية.</p>
        <Button
          onClick={() => {
            void menu.refetch();
            void info.refetch();
          }}
        >
          إعادة المحاولة
        </Button>
      </Centered>
    );
  }

  if (menu.isLoading || info.isLoading || (mode === "table" && table.isLoading) || !info.data) {
    return (
      <Centered>
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-wine-600)]" />
      </Centered>
    );
  }

  const addLine = (line: CartLine) => {
    cart.add(line);
    setActiveItem(null);
    toast.success(`أُضيف: ${line.name}`);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col pb-28">
      <header className="flex flex-col gap-2 px-4 pb-3 pt-6">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold">{info.data.restaurant_name || "قائمة الطعام"}</h1>
          {mode === "table" && table.data && (
            <Badge variant="gold" className="shrink-0">
              <Armchair className="ms-1 inline h-3.5 w-3.5" />
              طاولة {table.data.table_number}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--color-ink-soft)]">
          {info.data.address && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {info.data.address}
            </span>
          )}
          {info.data.phone && (
            <a href={`tel:${info.data.phone}`} className="flex items-center gap-1" dir="ltr">
              <Phone className="h-3.5 w-3.5" />
              {info.data.phone}
            </a>
          )}
        </div>
      </header>

      {lastOrder && (
        <Link
          to={`/track/${lastOrder.token}`}
          className="mx-4 mb-3 flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-gold-500)] bg-white px-4 py-3 text-sm font-medium"
        >
          <span>تابع حالة طلبك الحالي</span>
          <span aria-hidden>←</span>
        </Link>
      )}

      {!orderingEnabled && (
        <p className="mx-4 mb-3 rounded-[var(--radius-md)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
          {mode === "table"
            ? "الطلب من الموبايل غير متاح حالياً. بتقدر تتصفّح القائمة وتطلب من الموظف."
            : "الطلب الأونلاين متوقف حالياً. بتقدر تتصفّح القائمة وتتواصل معنا بالهاتف."}
        </p>
      )}

      <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 px-4 py-2 backdrop-blur">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <Input className="ps-9" placeholder="ابحث بالقائمة..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="التصنيفات">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className="shrink-0 rounded-full border border-[var(--color-line)] bg-white px-3.5 py-1.5 text-sm"
              onClick={() => document.getElementById(`cat-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              {c.name}
            </button>
          ))}
        </nav>
      </div>

      <main className="flex flex-col gap-8 px-4 py-4">
        {categories.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--color-ink-soft)]">{search ? "ما في نتائج مطابقة" : "القائمة فاضية حالياً"}</p>
        )}
        {categories.map((category) => (
          <section key={category.id} id={`cat-${category.id}`} className="scroll-mt-36">
            <h2 className="mb-3 text-lg font-semibold">{category.name}</h2>
            <ul className="flex flex-col gap-3">
              {category.items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveItem(item)}
                    className={`flex w-full gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-3 text-start transition-shadow hover:shadow-sm ${item.sold_out ? "opacity-60" : ""}`}
                  >
                    {item.image && (
                      <img src={`/storage/${item.image}`} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-[var(--radius-sm)] object-cover" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        {item.description && <p className="line-clamp-2 text-xs text-[var(--color-ink-soft)]">{item.description}</p>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="tabular font-semibold">{formatCurrency(item.price, currency)}</span>
                        {item.sold_out && <Badge variant="danger">خلص</Badge>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      {orderingEnabled && cart.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[var(--color-paper)] via-[var(--color-paper)] to-transparent p-4">
          <div className="mx-auto max-w-2xl">
            <Button size="lg" className="w-full justify-between" onClick={() => setCheckoutOpen(true)}>
              <span className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                عرض السلة ({cart.count})
              </span>
              <span className="tabular">{formatCurrency(cart.subtotal, currency)}</span>
            </Button>
          </div>
        </div>
      )}

      <ItemDialog
        key={activeItem?.id ?? "none"}
        item={activeItem}
        currency={currency}
        canOrder={orderingEnabled}
        onOpenChange={(open) => !open && setActiveItem(null)}
        onAdd={addLine}
      />

      <CheckoutDialog
        open={checkoutOpen && cart.count > 0}
        onOpenChange={setCheckoutOpen}
        cart={cart}
        info={info.data}
        mode={mode}
        tableToken={token}
        menuPath={menuPath}
      />
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">{children}</div>;
}
