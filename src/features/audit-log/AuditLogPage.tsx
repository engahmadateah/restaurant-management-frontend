import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye, ChevronRight, ChevronLeft, X } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { auditLogApi, type AuditAction, type AuditLogEntry } from "@/api/auditLog";
import { formatDateTime } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roleLabels";
import type { UserRole } from "@/types/auth";
import { AuditLogDetailDialog } from "./AuditLogDetailDialog";
import { ACTION_BADGE, ACTION_LABELS, modelLabel } from "./auditLabels";


const ALL = "all";

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [userId, setUserId] = useState(ALL);
  const [auditableId, setAuditableId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [viewing, setViewing] = useState<AuditLogEntry | null>(null);

  const { data: filters } = useQuery({
    queryKey: ["audit-logs", "filters"],
    queryFn: auditLogApi.filters,
    staleTime: 5 * 60_000,
  });

  const modelOptions = useMemo(
    () => [...(filters?.models ?? [])].sort((a, b) => modelLabel(a).localeCompare(modelLabel(b), "ar")),
    [filters?.models]
  );

  const hasModel = model !== ALL;
  const recordFilterActive = hasModel && auditableId !== "";
  const anyFilter = action !== ALL || hasModel || userId !== ALL || auditableId !== "" || from !== "" || to !== "";
  const badRange = from !== "" && to !== "" && to < from;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", page, action, model, userId, auditableId, from, to],
    queryFn: () =>
      auditLogApi.list({
        page,
        action: action === ALL ? undefined : (action as AuditAction),
        model: hasModel ? model : undefined,
        user_id: userId === ALL ? undefined : Number(userId),
       
        auditable_id: hasModel && auditableId ? Number(auditableId) : undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    enabled: !badRange,
    placeholderData: keepPreviousData,
  });

  const resetFilters = () => {
    setPage(1);
    setAction(ALL);
    setModel(ALL);
    setUserId(ALL);
    setAuditableId("");
    setFrom("");
    setTo("");
  };

  const showRecordHistory = (entry: AuditLogEntry) => {
    setPage(1);
    setAction(ALL);
    setModel(entry.auditable_type_short);
    setAuditableId(String(entry.auditable_id));
    setViewing(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="سجل التدقيق" description="مين عدّل شو وإيمتى: كل الإنشاءات والتعديلات والحذف المهمة بالنظام" />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>الإجراء</Label>
          <Select
            value={action}
            onValueChange={(v) => {
              setPage(1);
              setAction(v);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>الكل</SelectItem>
              {(Object.keys(ACTION_LABELS) as AuditAction[]).map((a) => (
                <SelectItem key={a} value={a}>
                  {ACTION_LABELS[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>النوع</Label>
          <Select
            value={model}
            onValueChange={(v) => {
              setPage(1);
              setModel(v);
             
              setAuditableId("");
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>الكل</SelectItem>
              {modelOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {modelLabel(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>الموظف</Label>
          <Select
            value={userId}
            onValueChange={(v) => {
              setPage(1);
              setUserId(v);
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>الكل</SelectItem>
              {filters?.users.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} ({ROLE_LABELS[u.role as UserRole] ?? u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="auditableId">رقم السجل</Label>
          <Input
            id="auditableId"
            type="number"
            min={1}
            className="w-32"
            placeholder={hasModel ? "مثال: 45" : "اختر النوع أولاً"}
            value={auditableId}
            disabled={!hasModel}
            onChange={(e) => {
              setPage(1);
              setAuditableId(e.target.value);
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">من تاريخ</Label>
          <Input
            id="from"
            type="date"
            value={from}
            onChange={(e) => {
              setPage(1);
              setFrom(e.target.value);
            }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">لتاريخ</Label>
          <Input
            id="to"
            type="date"
            value={to}
            onChange={(e) => {
              setPage(1);
              setTo(e.target.value);
            }}
          />
        </div>

        {anyFilter && (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="h-4 w-4" />
            مسح الفلاتر
          </Button>
        )}
      </div>

      {badRange && <p className="text-sm text-[var(--color-danger)]">تاريخ النهاية لازم يكون بعد تاريخ البداية</p>}
      {isError && <p className="text-sm text-[var(--color-danger)]">تعذّر تحميل السجل</p>}

      {recordFilterActive && (
        <p className="text-sm text-[var(--color-ink-soft)]">
          عم تشوف كل تغييرات: <span className="font-medium text-[var(--color-ink)]">{modelLabel(model)} #{auditableId}</span>
        </p>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>الموظف</TableHead>
              <TableHead>الإجراء</TableHead>
              <TableHead>السجل</TableHead>
              <TableHead className="w-16 text-left">عرض</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableEmpty colSpan={5}>جارِ التحميل...</TableEmpty>}
            {!isLoading && data?.data.length === 0 && <TableEmpty colSpan={5}>ما في سجلات</TableEmpty>}
            {data?.data.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="tabular text-[var(--color-ink-soft)]">{formatDateTime(entry.created_at)}</TableCell>
                <TableCell>{entry.user?.name ?? "النظام"}</TableCell>
                <TableCell>
                  <Badge variant={ACTION_BADGE[entry.action as AuditAction] ?? "neutral"}>
                    {ACTION_LABELS[entry.action as AuditAction] ?? entry.action}
                  </Badge>
                </TableCell>
                <TableCell>
                  {modelLabel(entry.auditable_type_short)} #{entry.auditable_id}
                </TableCell>
                <TableCell className="text-left">
                  <Button variant="ghost" size="icon" aria-label="عرض التفاصيل" onClick={() => setViewing(entry)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="icon" aria-label="السابق" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="text-sm text-[var(--color-ink-soft)]">
            صفحة {data.current_page} من {data.last_page}
          </p>
          <Button
            variant="outline"
            size="icon"
            aria-label="التالي"
            disabled={page >= data.last_page}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      <AuditLogDetailDialog
        entry={viewing}
        onOpenChange={(open) => !open && setViewing(null)}
        onShowRecordHistory={showRecordHistory}
      />
    </div>
  );
}
