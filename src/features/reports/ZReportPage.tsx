import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, Printer } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { reportsApi } from "@/api/reports";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatTime } from "@/lib/format";
import { openBlob, todayYmd } from "@/lib/download";
import { usePermissions } from "@/hooks/usePermissions";
import { StatBlock } from "./StatBlock";

const METHOD_LABELS: Record<string, string> = { cash: "نقدًا", card: "بطاقة", online: "إلكتروني" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function ZReportPage() {
  const canExport = usePermissions().hasPermission("reports.export");
  const today = todayYmd();
  const [date, setDate] = useState(today);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["z-report", date],
    queryFn: () => reportsApi.zReport(date),
    enabled: !!date,
  });

  const print = useMutation({
    mutationFn: () => reportsApi.zReportPdf(date),
    onSuccess: (blob) => openBlob(blob, `z-report-${date}.pdf`),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="تقرير نهاية اليوم"
        description="ملخّص مبيعات اليوم والمقبوض والاسترجاعات وفروقات الصناديق"
        action={
          canExport && (
            <Button variant="outline" disabled={!data || print.isPending} onClick={() => print.mutate()}>
              <Printer className="h-4 w-4" />
              طباعة PDF
            </Button>
          )
        }
      />

      <div className="flex items-center gap-3">
        <Input type="date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        {date !== today && (
          <Button variant="ghost" size="sm" onClick={() => setDate(today)}>
            اليوم
          </Button>
        )}
      </div>

      {isLoading && <p className="text-sm text-[var(--color-ink-soft)]">جارِ التحميل...</p>}
      {isError && <p className="text-sm text-[var(--color-danger)]">{getApiErrorMessage(error)}</p>}

      {data && (
        <>
          {data.drawers.open_now > 0 && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm text-[var(--color-warning)]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              في {data.drawers.open_now} صندوق لسا مفتوح — الفروقات تحت ما بتشمله. سكّره قبل اعتماد التقرير.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatBlock label="صافي المقبوض" value={formatCurrency(data.net_collected)} hint="المقبوض − الاسترجاعات المعتمدة اليوم" />
            <StatBlock label="إجمالي المقبوض" value={formatCurrency(data.payments.collected)} />
            <StatBlock label="الاسترجاعات" value={formatCurrency(data.refunds.total)} hint={`${data.refunds.count} عملية — نقدي ${formatCurrency(data.refunds.cash_total)}`} />
            <StatBlock
              label="فروقات الصناديق"
              value={formatCurrency(data.drawers.net_difference)}
              hint={`عجز ${formatCurrency(Math.abs(data.drawers.shortage))} — زيادة ${formatCurrency(data.drawers.overage)}`}
            />
          </div>

          <Section title="المبيعات">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatBlock label="عدد الطلبات" value={String(data.sales.orders_count)} hint={`ملغية: ${data.sales.cancelled_orders}`} />
              <StatBlock label="إجمالي المبيعات" value={formatCurrency(data.sales.gross_sales)} />
              <StatBlock label="الخصومات" value={formatCurrency(data.sales.discounts)} />
              <StatBlock label="الضريبة" value={formatCurrency(data.sales.tax)} />
              <StatBlock label="رسوم التوصيل" value={formatCurrency(data.sales.delivery_fees)} />
              <StatBlock label="غير مدفوع بعد" value={formatCurrency(data.sales.outstanding)} />
            </div>
          </Section>

          <Section title="المقبوض حسب طريقة الدفع">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطريقة</TableHead>
                  <TableHead>عدد الدفعات</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الباقي المرجَّع للزبائن</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.payments.by_method.map((m) => (
                  <TableRow key={m.method}>
                    <TableCell>{METHOD_LABELS[m.method] ?? m.method}</TableCell>
                    <TableCell className="tabular">{m.count}</TableCell>
                    <TableCell className="tabular">{formatCurrency(m.total)}</TableCell>
                    <TableCell className="tabular">{m.method === "cash" ? formatCurrency(m.change_given) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>

          {data.cash_movements.count > 0 && (
            <Section title="الحركات النقدية على الصناديق">
              <div className="grid grid-cols-3 gap-4">
                <StatBlock label="مصاريف نقدية" value={formatCurrency(data.cash_movements.expenses)} hint="مسجّلة كمان بالمصاريف" />
                <StatBlock label="سحوبات" value={formatCurrency(data.cash_movements.withdrawals)} />
                <StatBlock label="إيداعات" value={formatCurrency(data.cash_movements.deposits)} />
              </div>
            </Section>
          )}

          <Section title="الصناديق المسكّرة اليوم">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الكاشير</TableHead>
                    <TableHead>الفتح</TableHead>
                    <TableHead>الإغلاق</TableHead>
                    <TableHead>البداية</TableHead>
                    <TableHead>المتوقع</TableHead>
                    <TableHead>المعدود</TableHead>
                    <TableHead>الفرق</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.drawers.items.length === 0 && <TableEmpty colSpan={7}>ما انسكّر أي صندوق بهاليوم</TableEmpty>}
                  {data.drawers.items.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.user ?? "—"}</TableCell>
                      <TableCell className="text-[var(--color-ink-soft)]">{formatTime(d.opened_at)}</TableCell>
                      <TableCell className="text-[var(--color-ink-soft)]">{formatTime(d.closed_at)}</TableCell>
                      <TableCell className="tabular">{formatCurrency(d.opening_float)}</TableCell>
                      <TableCell className="tabular">{formatCurrency(d.expected_cash)}</TableCell>
                      <TableCell className="tabular">{formatCurrency(d.counted_cash)}</TableCell>
                      <TableCell>
                        {d.difference === 0 ? (
                          <Badge variant="success">مطابق</Badge>
                        ) : (
                          <Badge variant={d.difference < 0 ? "danger" : "warning"}>
                            {d.difference < 0 ? "عجز" : "زيادة"} {formatCurrency(Math.abs(d.difference))}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
