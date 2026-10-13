import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Award, Heart, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { customersApi, type CustomerPayload } from "@/api/customers";
import { getApiErrorMessage } from "@/api/client";
import type { Customer } from "@/types/models";
import { CustomerFormDialog, type CustomerFormValues } from "./CustomerFormDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { CustomerLoyaltyDialog } from "./CustomerLoyaltyDialog";
import { CustomerFavoritesDialog } from "./CustomerFavoritesDialog";

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("orders.manage");
  const canDelete = hasPermission("customers.manage");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<Customer | null>(null);
  const [favoritesCustomer, setFavoritesCustomer] = useState<Customer | null>(null);

  const [page, setPage] = useState(1);


  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["customers", "page", debouncedSearch, page],
    queryFn: () => customersApi.page({ search: debouncedSearch || undefined, page, per_page: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const customers = data?.data;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers"] });

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      toast.success("تمت إضافة الزبون");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CustomerPayload }) => customersApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الزبون");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleSubmit(values: CustomerFormValues) {
    const payload: CustomerPayload = { ...values, email: values.email || null, address: values.address || null };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الزبائن"
        description="إدارة بيانات الزبائن ونقاط الولاء"
        action={
          canEdit && (
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              زبون جديد
            </Button>
          )
        }
      />

      <div className="relative max-w-xs">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-soft)]" />
        <Input
          placeholder="بحث بالاسم أو الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>الهاتف</TableHead>
            <TableHead>البريد الإلكتروني</TableHead>
            <TableHead>نقاط الولاء</TableHead>
            <TableHead className="w-32 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={5}>جارِ التحميل...</TableEmpty>}
          {!isLoading && customers?.length === 0 && (
            <TableEmpty colSpan={5}>{debouncedSearch ? "ما في زبائن مطابقين للبحث" : "ما في زبائن بعد"}</TableEmpty>
          )}
          {customers?.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">{customer.name}</TableCell>
              <TableCell className="tabular">{customer.phone}</TableCell>
              <TableCell className="text-[var(--color-ink-soft)]">{customer.email ?? "—"}</TableCell>
              <TableCell>
                <Badge variant="gold">{customer.loyalty_points} نقطة</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setLoyaltyCustomer(customer)} title="نقاط الولاء">
                    <Award className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFavoritesCustomer(customer)}
                    title="المفضّلة"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(customer);
                      setFormOpen(true);
                    }}
                    title="تعديل"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  )}
                  {canDelete && (
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(customer)} title="حذف">
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-[var(--color-ink-soft)]">
          <span>
            صفحة {data.current_page} من {data.last_page} — {data.total} زبون
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <CustomerLoyaltyDialog
        open={!!loyaltyCustomer}
        onOpenChange={(open) => !open && setLoyaltyCustomer(null)}
        customer={loyaltyCustomer}
      />

      <CustomerFavoritesDialog
        open={!!favoritesCustomer}
        onOpenChange={(open) => !open && setFavoritesCustomer(null)}
        customer={favoritesCustomer}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف "${deleting?.name}"؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
