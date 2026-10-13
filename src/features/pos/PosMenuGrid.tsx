import { useEffect, useRef, useState } from "react";
import { ImageOff, PackageX, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { Category, MenuItem } from "@/types/models";

interface PosMenuGridProps {
  categories?: Category[];
  items?: MenuItem[];
  isLoading: boolean;
  activeCategory: number | "all";
  onCategoryChange: (id: number | "all") => void;
  onAdd: (item: MenuItem) => void;
}

export function PosMenuGrid({ categories, items, isLoading, activeCategory, onCategoryChange, onAdd }: PosMenuGridProps) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = search.trim().toLowerCase();
  const visibleItems = items?.filter(
    (i) =>
      (activeCategory === "all" || i.category_id === activeCategory) &&
      (!q || i.name.toLowerCase().includes(q))
  );

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setSearch("");
      return;
    }
   
    if (e.key === "Enter") {
      e.preventDefault();
      const first = visibleItems?.find((i) => !(i.track_stock && (i.stock_quantity ?? 0) <= 0));
      if (first) {
        onAdd(first);
        setSearch("");
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
        <Input
          ref={searchRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="ابحث عن صنف...  (اضغط / للبحث السريع، Enter للإضافة)"
          className="pr-9 pl-9"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            aria-label="مسح البحث"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={cn(
            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            activeCategory === "all"
              ? "border-[var(--color-wine-600)] bg-[var(--color-wine-600)] text-white"
              : "border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-wine-50)]"
          )}
        >
          الكل
        </button>
        {categories?.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeCategory === cat.id
                ? "border-[var(--color-wine-600)] bg-[var(--color-wine-600)] text-white"
                : "border-[var(--color-line)] bg-white text-[var(--color-ink)] hover:bg-[var(--color-wine-50)]"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {isLoading && <p className="py-10 text-center text-sm text-[var(--color-ink-soft)]">جارِ تحميل القائمة...</p>}

      {!isLoading && visibleItems?.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--color-ink-soft)]">ما في أصناف مطابقة</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visibleItems?.map((item) => {
          const outOfStock = item.track_stock && (item.stock_quantity ?? 0) <= 0;
          return (
            <button
              key={item.id}
              type="button"
              disabled={outOfStock}
              onClick={() => onAdd(item)}
              className={cn(
                "flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white text-right shadow-[var(--shadow-soft)] transition-transform",
                outOfStock ? "cursor-not-allowed opacity-50" : "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
              )}
            >
              <div className="flex h-24 items-center justify-center bg-[var(--color-wine-50)]">
                {item.image ? (
                  <img src={`/storage/${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageOff className="h-6 w-6 text-[var(--color-wine-300)]" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="line-clamp-1 text-sm font-medium text-[var(--color-ink)]">{item.name}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="tabular text-sm font-semibold text-[var(--color-wine-600)]">
                    {formatCurrency(item.price)}
                  </span>
                  {outOfStock && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-danger)]">
                      <PackageX className="h-3.5 w-3.5" />
                      نفد
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
