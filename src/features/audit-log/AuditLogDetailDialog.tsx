import { History } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { AuditAction, AuditLogEntry } from "@/api/auditLog";
import { ACTION_BADGE, ACTION_LABELS, fieldLabel, modelLabel } from "./auditLabels";


const NOISE_FIELDS = new Set(["updated_at"]);

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "نعم" : "لا";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}


function diffRows(entry: AuditLogEntry) {
  const before = entry.old_values ?? {};
  const after = entry.new_values ?? {};
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter((k) => !NOISE_FIELDS.has(k));
  return keys.map((key) => ({ key, before: before[key], after: after[key] }));
}

export function AuditLogDetailDialog({
  entry,
  onOpenChange,
  onShowRecordHistory,
}: {
  entry: AuditLogEntry | null;
  onOpenChange: (open: boolean) => void;
  
  onShowRecordHistory?: (entry: AuditLogEntry) => void;
}) {
  const action = entry?.action as AuditAction | undefined;
  const rows = entry ? diffRows(entry) : [];

  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action && <Badge variant={ACTION_BADGE[action] ?? "neutral"}>{ACTION_LABELS[action] ?? entry?.action}</Badge>}
            {entry && `${modelLabel(entry.auditable_type_short)} #${entry.auditable_id}`}
          </DialogTitle>
          <DialogDescription>
            {entry?.user?.name ?? "النظام"} · {entry && formatDateTime(entry.created_at)}
            {entry?.ip_address && <span dir="ltr"> · {entry.ip_address}</span>}
          </DialogDescription>
        </DialogHeader>

        {entry && (
          <div className="flex flex-col gap-3">
            <div className="max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الحقل</TableHead>
                    {action !== "created" && <TableHead>قبل</TableHead>}
                    {action !== "deleted" && <TableHead>بعد</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-[var(--color-ink-soft)]">
                        ما في تفاصيل مسجّلة
                      </TableCell>
                    </TableRow>
                  )}
                  {rows.map((r) => (
                    <TableRow key={r.key}>
                      <TableCell className="whitespace-nowrap">
                        {fieldLabel(r.key)}
                        {fieldLabel(r.key) !== r.key && (
                          <span className="ms-1 text-xs text-[var(--color-ink-soft)]" dir="ltr">
                            {r.key}
                          </span>
                        )}
                      </TableCell>
                      {action !== "created" && (
                        <TableCell className="break-all text-[var(--color-ink-soft)]" dir="auto">
                          {formatValue(r.before)}
                        </TableCell>
                      )}
                      {action !== "deleted" && (
                        <TableCell className="break-all font-medium" dir="auto">
                          {formatValue(r.after)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {onShowRecordHistory && (
              <div>
                <Button variant="outline" size="sm" onClick={() => onShowRecordHistory(entry)}>
                  <History className="h-4 w-4" />
                  كل تغييرات هالسجل
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
