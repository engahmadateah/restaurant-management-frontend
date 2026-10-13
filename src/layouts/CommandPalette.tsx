import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CornerDownLeft, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { navSections } from "@/routes/navConfig";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** بحث سريع بالصفحات (Ctrl+K): بيعرض بس الصفحات يلي المستخدم عنده صلاحية إلها. */
export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermissions();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () =>
      navSections.flatMap((section) =>
        section.items
          .filter((item) => !item.permission || hasAnyPermission(item.permission))
          .map((item) => ({ ...item, section: section.title }))
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasAnyPermission]
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return items.filter((i) => i.label.includes(q) || i.section.includes(q));
  }, [items, query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(index: number) {
    const target = results[index];
    if (!target) return;
    onOpenChange(false);
    navigate(target.to);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(active);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-md translate-y-0 gap-0 p-0">
        <DialogTitle className="sr-only">بحث سريع</DialogTitle>
        <DialogDescription className="sr-only">اكتب اسم الصفحة للانتقال إليها</DialogDescription>

        <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-3 pl-12">
          <Search className="h-4 w-4 shrink-0 text-[var(--color-ink-soft)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ابحث عن صفحة... (مثال: طلبات، تقارير)"
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--color-ink-soft)]"
          />
        </div>

        <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-[var(--color-ink-soft)]">ما في نتائج</p>
          )}
          {results.map((item, i) => (
            <button
              key={item.to}
              type="button"
              data-index={i}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-right text-sm transition-colors",
                i === active ? "bg-[var(--color-wine-50)] text-[var(--color-wine-700)]" : "text-[var(--color-ink)]"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-[var(--color-ink-soft)]">{item.section}</span>
              {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-[var(--color-ink-soft)]" />}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
