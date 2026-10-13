import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { favoritesApi } from "@/api/favorites";
import { menuItemsApi } from "@/api/menuItems";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency } from "@/lib/format";
import type { Customer } from "@/types/models";

export function CustomerFavoritesDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}) {
  const queryClient = useQueryClient();
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["favorites", customer?.id],
    queryFn: () => favoritesApi.list(customer!.id),
    enabled: open && !!customer,
  });


  const { data: menuItems } = useQuery({
    queryKey: ["menu-items", "all"],
    queryFn: () => menuItemsApi.list(),
    enabled: open,
  });

  const availableToAdd = useMemo(() => {
    const favoriteIds = new Set((favorites ?? []).map((f) => f.id));
    return (menuItems ?? []).filter((item) => !favoriteIds.has(item.id));
  }, [menuItems, favorites]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["favorites", customer?.id] });

  const addMutation = useMutation({
    mutationFn: (menuItemId: number) => favoritesApi.add(customer!.id, menuItemId),
    onSuccess: () => {
      toast.success("تمت إضافة الصنف للمفضّلة");
      setSelectedItemId("");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (menuItemId: number) => favoritesApi.remove(customer!.id, menuItemId),
    onSuccess: () => {
      toast.success("تم حذف الصنف من المفضّلة");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleAdd() {
    if (!selectedItemId) return;
    addMutation.mutate(Number(selectedItemId));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>المفضّلة — {customer?.name}</DialogTitle>
          <DialogDescription>الأصناف يلي الزبون بيحبها من المنيو</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر صنف لإضافته..." />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.length === 0 && (
                <div className="px-3 py-2 text-sm text-[var(--color-ink-soft)]">ما في أصناف لإضافتها</div>
              )}
              {availableToAdd.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!selectedItemId || addMutation.isPending} size="icon">
            {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-sm text-[var(--color-ink-soft)]">
              جارِ التحميل...
            </div>
          )}
          {!isLoading && favorites?.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6 text-sm text-[var(--color-ink-soft)]">
              <Heart className="h-6 w-6 text-[var(--color-wine-200)]" />
              ما في أصناف مفضّلة بعد
            </div>
          )}
          {favorites?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 shrink-0 fill-[var(--color-wine-600)] text-[var(--color-wine-600)]" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink)]">{item.name}</p>
                  <p className="text-xs text-[var(--color-ink-soft)]">
                    {item.category?.name ?? "—"} · {formatCurrency(item.price)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMutation.mutate(item.id)}
                disabled={removeMutation.isPending}
                title="حذف من المفضّلة"
              >
                <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
