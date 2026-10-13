import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { categoriesApi, type CategoryPayload } from "@/api/categories";
import { getApiErrorMessage } from "@/api/client";
import type { Category } from "@/types/models";
import { CategoryFormDialog, type CategoryFormValues } from "./CategoryFormDialog";

export function CategoriesTab() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    queryClient.invalidateQueries({ queryKey: ["menu-items"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CategoryPayload) => categoriesApi.create(payload),
    onSuccess: () => {
      toast.success("تمت إضافة التصنيف");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CategoryPayload> }) =>
      categoriesApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف التصنيف");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setDeleting(null);
    },
  });

  function handleSubmit(values: CategoryFormValues) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload: values });
    } else {
      createMutation.mutate(values);
    }
  }

  const sorted = [...(data ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          تصنيف جديد
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>المعرّف</TableHead>
            <TableHead>الترتيب</TableHead>
            <TableHead>الضريبة</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-24 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={6}>جارِ التحميل...</TableEmpty>}
          {!isLoading && sorted.length === 0 && (
            <TableEmpty colSpan={6}>
              <div className="flex flex-col items-center gap-2 py-4">
                <Tags className="h-8 w-8 text-[var(--color-ink-soft)]" />
                ما في تصنيفات مضافة بعد
              </div>
            </TableEmpty>
          )}
          {sorted.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell className="font-mono text-xs text-[var(--color-ink-soft)]" dir="ltr">
                {category.slug}
              </TableCell>
              <TableCell className="tabular">{category.sort_order}</TableCell>
              <TableCell className="tabular text-[var(--color-ink-soft)]">
                {category.tax_rate !== null ? `${Number((Number(category.tax_rate) * 100).toFixed(2))}%` : "النسبة العامة"}
              </TableCell>
              <TableCell>
                {category.is_active ? <Badge variant="success">فعّال</Badge> : <Badge variant="neutral">معطّل</Badge>}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="تعديل"
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(category)}>
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف التصنيف "${deleting?.name}"؟`}
        description="هاد الإجراء ما بينرجع. إذا فيه أصناف مرتبطة فيه ممكن السيرفر يرفض الحذف."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
