import { useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Lock, Plus, Unlock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cashDrawersApi, type CashDrawer, type CashMovementPayload } from "@/api/cashDrawers";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { createIdempotencyKeeper } from "@/lib/idempotency";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/authStore";
import { StatBlock } from "@/features/reports/StatBlock";
import { CloseDrawerDialog } from "./CloseDrawerDialog";
import { CashMovementDialog } from "./CashMovementDialog";
import { CashMovementsPanel } from "./CashMovementsPanel";

const PER_PAGE = 15;

function DifferenceBadge({ drawer }: { drawer: CashDrawer }) {
  if (drawer.difference === null) return <span className="text-[var(--color-ink-soft)]">—</span>;
  const d = Number(drawer.difference);
  if (d === 0) return <Badge variant="success">مطابق</Badge>;
  return (
    <Badge variant={d < 0 ? "danger" : "warning"}>
      {d < 0 ? "عجز" : "زيادة"} {formatCurrency(Math.abs(d))}
    </Badge>
  );
}

export default function CashDrawerPage() {
  const queryClient = useQueryClient();
  const myId = useAuthStore((s) => s.user?.id);
  const canManageAll = usePermissions().hasPermission("drawer.manage_all");

  const [openingFloat, setOpeningFloat] = useState("");
  const [closing, setClosing] = useState<CashDrawer | null>(null);
  const [addingMovement, setAddingMovement] = useState<CashDrawer | null>(null);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  
  const openKeeper = useRef(createIdempotencyKeeper()).current;
  const closeKeeper = useRef(createIdempotencyKeeper()).current;
  const movementKeeper = useRef(createIdempotencyKeeper()).current;

  const { data: current, isLoading: currentLoading } = useQuery({
    queryKey: ["cash-drawer", "current"],
    queryFn: cashDrawersApi.current,
    refetchInterval: 30_000, 
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["cash-drawer", "list", status, page],
    queryFn: () =>
      cashDrawersApi.list({
        status: status === "all" ? undefined : (status as "open" | "closed"),
        per_page: PER_PAGE,
        page,
      }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cash-drawer"] });

  const openMutation = useMutation({
    mutationFn: (amount: number) => cashDrawersApi.open(amount, openKeeper.keyFor({ amount })),
    onSuccess: () => {
      openKeeper.reset();
      toast.success("تم فتح الصندوق");
      setOpeningFloat("");
      invalidate();
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const closeMutation = useMutation({
    mutationFn: ({ drawer, payload }: { drawer: CashDrawer; payload: { counted_cash: number; notes?: string } }) =>
      cashDrawersApi.close(drawer.id, payload, closeKeeper.keyFor({ id: drawer.id, ...payload })),
    onSuccess: (drawer) => {
      closeKeeper.reset();
      const diff = Number(drawer.difference ?? 0);
      if (diff === 0) toast.success("تم إغلاق الصندوق — الكاش مطابق");
      else toast.warning(`تم إغلاق الصندوق — ${diff < 0 ? "عجز" : "زيادة"} ${formatCurrency(Math.abs(diff))}`);
      setClosing(null);
      invalidate();
    },
   
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const movementMutation = useMutation({
    mutationFn: ({ drawer, payload }: { drawer: CashDrawer; payload: CashMovementPayload }) =>
      cashDrawersApi.addMovement(drawer.id, payload, movementKeeper.keyFor({ id: drawer.id, ...payload })),
    onSuccess: () => {
      movementKeeper.reset();
      toast.success("تم تسجيل الحركة");
      setAddingMovement(null);
      invalidate();
   
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const floatNum = Number(openingFloat);
  const floatValid = openingFloat.trim() !== "" && Number.isFinite(floatNum) && floatNum >= 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="الصندوق" description="افتح الصندوق برصيد البداية وسكّره بعد عدّ الكاش لتعرف أي فرق" />

      {currentLoading ? (
        <p className="text-sm text-[var(--color-ink-soft)]">جارِ التحميل...</p>
      ) : current ? (
        <div className="flex flex-col gap-4">
          {current.is_stale && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              هالصندوق مفتوح من أكتر من 24 ساعة ({formatDateTime(current.opened_at)}). على الأغلب نسيت تسكّره.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatBlock label="رصيد البداية" value={formatCurrency(current.opening_float)} hint={`فُتح ${formatDateTime(current.opened_at)}`} />
            <StatBlock label="مبيعات نقدية" value={formatCurrency(current.cash_sales ?? 0)} />
            <StatBlock label="استرجاعات نقدية" value={formatCurrency(current.cash_refunds ?? 0)} />
            <StatBlock
              label="المتوقع بالصندوق"
              value={formatCurrency(current.expected_cash ?? 0)}
              hint="بداية + مبيعات − استرجاعات − مصاريف − سحوبات + إيداعات"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <StatBlock label="مصاريف نقدية" value={formatCurrency(current.cash_expenses ?? 0)} />
            <StatBlock label="سحوبات" value={formatCurrency(current.cash_withdrawals ?? 0)} />
            <StatBlock label="إيداعات" value={formatCurrency(current.cash_deposits ?? 0)} />
          </div>
          {(current.by_method?.card || current.by_method?.online) && (
            <p className="text-sm text-[var(--color-ink-soft)]">
              مقبوض خارج الصندوق (مش بالمتوقع):
              {current.by_method?.card && ` بطاقة ${formatCurrency(current.by_method.card.total)}`}
              {current.by_method?.online && ` — إلكتروني ${formatCurrency(current.by_method.online.total)}`}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setAddingMovement(current)}>
              <Plus className="h-4 w-4" />
              حركة نقدية (مصروف / سحب / إيداع)
            </Button>
            <Button onClick={() => setClosing(current)}>
              <Lock className="h-4 w-4" />
              إغلاق الصندوق
            </Button>
          </div>
          <CashMovementsPanel drawer={current} />
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 sm:max-w-md">
            <div>
              <p className="font-semibold">ما عندك صندوق مفتوح</p>
              <p className="text-sm text-[var(--color-ink-soft)]">اكتب الكاش الموجود بالدرج قبل ما تبدأ البيع</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="opening_float">رصيد البداية</Label>
              <Input
                id="opening_float"
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && floatValid && !openMutation.isPending) openMutation.mutate(floatNum);
                }}
              />
            </div>
            <Button disabled={!floatValid || openMutation.isPending} onClick={() => openMutation.mutate(floatNum)}>
              {openMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
              فتح الصندوق
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{canManageAll ? "سجل كل الصناديق" : "سجل صناديقي"}</h2>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="open">المفتوحة</SelectItem>
            <SelectItem value="closed">المسكّرة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {canManageAll && <TableHead>الكاشير</TableHead>}
              <TableHead>الفتح</TableHead>
              <TableHead>الإغلاق</TableHead>
              <TableHead>البداية</TableHead>
              <TableHead>المتوقع</TableHead>
              <TableHead>المعدود</TableHead>
              <TableHead>الفرق</TableHead>
              <TableHead>ملاحظات</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyLoading && <TableEmpty colSpan={canManageAll ? 9 : 8}>جارِ التحميل...</TableEmpty>}
            {!historyLoading && history?.data.length === 0 && (
              <TableEmpty colSpan={canManageAll ? 9 : 8}>ما في صناديق</TableEmpty>
            )}
            {history?.data.map((d) => (
              <TableRow key={d.id}>
                {canManageAll && <TableCell>{d.user?.name ?? `#${d.user_id}`}</TableCell>}
                <TableCell className="text-[var(--color-ink-soft)]">{formatDateTime(d.opened_at)}</TableCell>
                <TableCell className="text-[var(--color-ink-soft)]">
                  {d.closed_at ? (
                    <span className="flex flex-col">
                      {formatDateTime(d.closed_at)}
                      {d.closer && d.closed_by !== d.user_id && <span className="text-xs">بواسطة {d.closer.name}</span>}
                    </span>
                  ) : (
                    <Badge variant={d.is_stale ? "warning" : "info"}>{d.is_stale ? "مفتوح (منسي؟)" : "مفتوح"}</Badge>
                  )}
                </TableCell>
                <TableCell className="tabular">{formatCurrency(d.opening_float)}</TableCell>
                <TableCell className="tabular">{d.expected_cash !== null ? formatCurrency(d.expected_cash) : "—"}</TableCell>
                <TableCell className="tabular">{d.counted_cash !== null ? formatCurrency(d.counted_cash) : "—"}</TableCell>
                <TableCell>
                  <DifferenceBadge drawer={d} />
                </TableCell>
                <TableCell className="max-w-48 whitespace-pre-line text-[var(--color-ink-soft)]">{d.notes || "—"}</TableCell>
                <TableCell>
                  {!d.closed_at && canManageAll && d.user_id !== myId && (
                    <Button variant="outline" size="sm" onClick={() => setClosing(d)}>
                      إغلاق
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!!history?.last_page && history.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <span className="text-[var(--color-ink-soft)]">
            صفحة {history.current_page} من {history.last_page}
          </span>
          <Button variant="outline" size="sm" disabled={page >= history.last_page} onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </div>
      )}

      <CashMovementDialog
        drawer={addingMovement}
        onOpenChange={(open) => !open && setAddingMovement(null)}
        submitting={movementMutation.isPending}
        onSubmit={(drawer, payload) => movementMutation.mutate({ drawer, payload })}
      />

      <CloseDrawerDialog
        drawer={closing}
        onOpenChange={(open) => !open && setClosing(null)}
        submitting={closeMutation.isPending}
        onSubmit={(drawer, payload) => closeMutation.mutate({ drawer, payload })}
      />
    </div>
  );
}
