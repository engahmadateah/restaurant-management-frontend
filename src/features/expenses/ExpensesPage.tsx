import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Wallet, ChevronRight, ChevronLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { expensesApi, type ExpensePayload } from "@/api/expenses";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense, ExpenseCategory } from "@/types/models";
import { ExpenseFormDialog, type ExpenseFormValues } from "./ExpenseFormDialog";
import { EXPENSE_CATEGORY_LABELS } from "./categories";

const NONE = "none";

function localDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const PRESETS: { label: string; range: () => { from: string; to: string } }[] = [
  {
    label: "هالشهر",
    range: () => {
      const n = new Date();
      return { from: localDate(new Date(n.getFullYear(), n.getMonth(), 1)), to: localDate(n) };
    },
  },
  {
    label: "الشهر الماضي",
    range: () => {
      const n = new Date();
      return {
        from: localDate(new Date(n.getFullYear(), n.getMonth() - 1, 1)),
        to: localDate(new Date(n.getFullYear(), n.getMonth(), 0)),
      };
    },
  },
  {
    label: "آخر 30 يوم",
    range: () => {
      const n = new Date();
      const f = new Date();
      f.setDate(n.getDate() - 29);
      return { from: localDate(f), to: localDate(n) };
    },
  },
];
const PER_PAGE = 20;

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState<string>(NONE);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", categoryFilter, from, to, page],
    queryFn: () =>
      expensesApi.list({
        category: categoryFilter === NONE ? undefined : (categoryFilter as ExpenseCategory),
        from: from || undefined,
        to: to || undefined,
        per_page: PER_PAGE,
        page,
      }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["expenses"] });

  const createMutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      toast.success("تمت إضافة المصروف");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ExpensePayload }) => expensesApi.update(id, payload),
    onSuccess: () => {
      toast.success("تم حفظ التعديلات");
      invalidate();
      setFormOpen(false);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.remove(id),
    onSuccess: () => {
      toast.success("تم حذف المصروف");
      invalidate();
      setDeleting(null);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  function handleSubmit(values: ExpenseFormValues) {
    const payload: ExpensePayload = { ...values, notes: values.notes || undefined };
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function resetFiltersPage() {
    setPage(1);
  }

 
  async function exportCsv() {
    setExporting(true);
    try {
      const all = await expensesApi.list({
        category: categoryFilter === NONE ? undefined : (categoryFilter as ExpenseCategory),
        from: from || undefined,
        to: to || undefined,
        per_page: "all",
      });
      const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
      const lines = [
        ["العنوان", "التصنيف", "المبلغ", "التاريخ", "سجّلها", "ملاحظات"].map(esc).join(","),
        ...all.data.map((e) =>
          [
            esc(e.title),
            esc(EXPENSE_CATEGORY_LABELS[e.category] ?? e.category),
            String(Number(e.amount) || 0),
            esc(String(e.expense_date).slice(0, 10)),
            esc(e.creator?.name ?? ""),
            esc(e.notes ?? ""),
          ].join(",")
        ),
      ];
      const blob = new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `expenses-${localDate(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="المصاريف"
        description="سجل مصاريف المطعم التشغيلية"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            مصروف جديد
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v);
            resetFiltersPage();
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="كل التصنيفات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>كل التصنيفات</SelectItem>
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            resetFiltersPage();
          }}
          className="w-40"
          placeholder="من تاريخ"
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            resetFiltersPage();
          }}
          className="w-40"
          placeholder="إلى تاريخ"
        />
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const r = p.range();
            return (
              <Button
                key={p.label}
                type="button"
                size="sm"
                variant={r.from === from && r.to === to ? "default" : "outline"}
                onClick={() => {
                  setFrom(r.from);
                  setTo(r.to);
                  resetFiltersPage();
                }}
              >
                {p.label}
              </Button>
            );
          })}
        </div>
        {(from || to || categoryFilter !== NONE) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFrom("");
              setTo("");
              setCategoryFilter(NONE);
              resetFiltersPage();
            }}
          >
            مسح الفلاتر
          </Button>
        )}

        <Button variant="outline" size="sm" disabled={exporting} onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" />
          تصدير CSV
        </Button>

        <div className="mr-auto flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-wine-50)] px-4 py-2">
          <Wallet className="h-4 w-4 text-[var(--color-wine-700)]" />
          <span className="text-sm text-[var(--color-ink-soft)]">إجمالي المصاريف المفلترة:</span>
          <span className="font-semibold text-[var(--color-wine-700)] tabular">
            {formatCurrency(data?.total ?? 0)}
          </span>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>العنوان</TableHead>
            <TableHead>التصنيف</TableHead>
            <TableHead>المبلغ</TableHead>
            <TableHead>التاريخ</TableHead>
            <TableHead>سجّلها</TableHead>
            <TableHead className="w-24 text-left">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && <TableEmpty colSpan={6}>جارِ التحميل...</TableEmpty>}
          {!isLoading && data?.data.length === 0 && <TableEmpty colSpan={6}>ما في مصاريف مسجّلة</TableEmpty>}
          {data?.data.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.title}</TableCell>
              <TableCell>
                <Badge variant="neutral">{EXPENSE_CATEGORY_LABELS[expense.category]}</Badge>
              </TableCell>
              <TableCell className="tabular">{formatCurrency(expense.amount)}</TableCell>
              <TableCell className="tabular text-[var(--color-ink-soft)]">
                {formatDate(expense.expense_date)}
              </TableCell>
              <TableCell className="text-[var(--color-ink-soft)]">{expense.creator?.name ?? "—"}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="تعديل"
                    onClick={() => {
                      setEditing(expense);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="حذف" onClick={() => setDeleting(expense)}>
                    <Trash2 className="h-4 w-4 text-[var(--color-danger)]" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {!!data?.last_page && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>
          <span className="text-sm text-[var(--color-ink-soft)]">
            صفحة {data.current_page} من {data.last_page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editing}
        onSubmit={handleSubmit}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`حذف "${deleting?.title}"؟`}
        description="هاد الإجراء ما بينرجع."
        confirmLabel="حذف"
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}
