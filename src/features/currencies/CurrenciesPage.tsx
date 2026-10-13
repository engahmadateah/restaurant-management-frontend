import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Star, Coins } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { currenciesApi, type CurrencyPayload } from "@/api/currencies";
import { getApiErrorMessage } from "@/api/client";
import type { Currency } from "@/types/models";
import { CurrencyFormDialog, type CurrencyFormValues } from "./CurrencyFormDialog";

export default function CurrenciesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [deleting, setDeleting] = useState<Currency | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["currencies"],
    queryFn: () => currenciesApi.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["currencies"] });

  const createMutation = useMutation({
    mutationFn: currenciesApi.create,
    onSuccess: () => {
      toast.success("تمت إضافة العملة");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Omit<CurrencyPayload, "code">> }) =>
      currenciesApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => currenciesApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف العملة");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => currenciesApi.setDefault(id),
    onSuccess: () => {
      toast.success("تم تعيينها كعملة أساسية");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleSubmit(values: CurrencyFormValues) {
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        payload: {
          name: values.name,
          symbol: values.symbol,
          exchange_rate: values.exchange_rate,
          is_active: values.is_active,
        },
      });
    } else {
      createMutation.mutate(values);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="العملات"
        description="عملات النظام وأسعار الصرف مقابل العملة الأساسية"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            عملة جديدة
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-left">الرمز</TableHead>
            <TableHead>الاسم</TableHead>
            <TableHead>رمز العرض</TableHead>
            <TableHead>سعر الصرف</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead className="w-32 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={6}>جارِ التحميل...</TableEmpty>}
          {!isLoading && data?.length === 0 && (
            <TableEmpty colSpan={6}>
              <div className="flex flex-col items-center gap-2 py-4">
                <Coins className="h-8 w-8 text-[var(--color-ink-soft)]" />
                ما في عملات مضافة بعد
              </div>
            </TableEmpty>
          )}
          {data?.map((currency) => (
            <TableRow key={currency.id}>
              <TableCell dir="ltr" className="text-left font-mono font-medium">
                {currency.code}
              </TableCell>
              <TableCell>{currency.name}</TableCell>
              <TableCell>{currency.symbol}</TableCell>
              <TableCell className="tabular">{Number(currency.exchange_rate)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {currency.is_default && <Badge variant="gold">أساسية</Badge>}
                  <Badge variant={currency.is_active ? "success" : "neutral"}>
                    {currency.is_active ? "مفعّلة" : "معطّلة"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {!currency.is_default && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="تعيين كعملة أساسية"
                      disabled={setDefaultMutation.isPending}
                      onClick={() => setDefaultMutation.mutate(currency.id)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="تعديل"
                    onClick={() => {
                      setEditing(currency);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={currency.is_default ? "ما فيك تحذف العملة الأساسية" : "حذف"}
                    disabled={currency.is_default}
                    onClick={() => setDeleting(currency)}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <CurrencyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        currency={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف عملة "${deleting?.name}"؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
