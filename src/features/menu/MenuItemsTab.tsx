import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListPlus, Pencil, Plus, Search, Trash2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { categoriesApi } from "@/api/categories";
import { menuItemsApi, type MenuItemPayload } from "@/api/menuItems";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency } from "@/lib/format";
import type { MenuItem } from "@/types/models";
import { MenuItemFormDialog, type MenuItemFormValues } from "./MenuItemFormDialog";
import { ModifierGroupsDialog } from "./ModifierGroupsDialog";

export function MenuItemsTab() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [deleting, setDeleting] = useState<MenuItem | null>(null);
  const [modifiersFor, setModifiersFor] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");

  const { data: items, isLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: () => menuItemsApi.list(),
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const categoryName = useMemo(() => {
    const map = new Map<number, string>();
    (categories ?? []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["menu-items"] });

  const createMutation = useMutation({
    mutationFn: (payload: MenuItemPayload) => menuItemsApi.create(payload),
    onSuccess: () => {
      toast.success("تمت إضافة الصنف");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<MenuItemPayload> }) =>
      menuItemsApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const imageMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => menuItemsApi.uploadImage(id, file),
    onSuccess: (updated) => {
      toast.success("تم رفع الصورة");
      setEditing(updated);
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menuItemsApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الصنف");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setDeleting(null);
    },
  });

  function handleSubmit(values: MenuItemFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items ?? [])
      .filter((i) => (categoryFilter === "all" || i.category_id === categoryFilter) && (!q || i.name.toLowerCase().includes(q)))
      .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
  }, [items, search, categoryFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم الصنف..." className="pr-9" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={categoryFilter === "all" ? "default" : "outline"} onClick={() => setCategoryFilter("all")}>
            الكل
          </Button>
          {(categories ?? []).map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={categoryFilter === c.id ? "default" : "outline"}
              onClick={() => setCategoryFilter(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
        <Button
          className="mr-auto"
          disabled={!categories || categories.length === 0}
          title={categories && categories.length === 0 ? "أضف تصنيف أولاً" : undefined}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          صنف جديد
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الصنف</TableHead>
            <TableHead>التصنيف</TableHead>
            <TableHead>السعر</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-32 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={5}>جارِ التحميل...</TableEmpty>}
          {!isLoading && items && items.length > 0 && visible.length === 0 && (
            <TableEmpty colSpan={5}>ما في أصناف مطابقة</TableEmpty>
          )}
          {!isLoading && items?.length === 0 && (
            <TableEmpty colSpan={5}>
              <div className="flex flex-col items-center gap-2 py-4">
                <UtensilsCrossed className="h-8 w-8 text-[var(--color-ink-soft)]" />
                ما في أصناف مضافة بعد
              </div>
            </TableEmpty>
          )}
          {visible.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[var(--color-wine-50)]">
                    {item.image ? (
                      <img src={`/storage/${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <UtensilsCrossed className="h-4 w-4 text-[var(--color-ink-soft)]" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <span className="line-clamp-1 max-w-xs text-xs text-[var(--color-ink-soft)]">{item.description}</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-[var(--color-ink-soft)]">
                {item.category?.name ?? categoryName.get(item.category_id) ?? "—"}
              </TableCell>
              <TableCell className="tabular">{formatCurrency(item.price)}</TableCell>
              <TableCell>
                {item.is_available ? <Badge variant="success">متوفر</Badge> : <Badge variant="neutral">غير متوفر</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" title="الإضافات (Modifiers)" onClick={() => setModifiersFor(item)}>
                    <ListPlus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="تعديل"
                    onClick={() => {
                      setEditing(item);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(item)}>
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <MenuItemFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editing}
        categories={categories ?? []}
        onSubmit={handleSubmit}
        onImageChange={(file) => editing && imageMutation.mutate({ id: editing.id, file })}
        submitting={createMutation.isPending || updateMutation.isPending}
        uploadingImage={imageMutation.isPending}
      />

      <ModifierGroupsDialog
        open={!!modifiersFor}
        onOpenChange={(open) => !open && setModifiersFor(null)}
        menuItem={modifiersFor}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف الصنف "${deleting?.name}"؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
