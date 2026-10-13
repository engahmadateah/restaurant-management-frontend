import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, TrendingDown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/components/ui/table";
import { reportsApi, type ReportType } from "@/api/reports";
import { getApiErrorMessage } from "@/api/client";
import { formatCurrency, formatDate } from "@/lib/format";
import { EXPENSE_CATEGORY_LABELS } from "@/features/expenses/categories";
import { ROLE_LABELS } from "@/lib/roleLabels";
import type { ExpenseCategory } from "@/types/models";
import type { UserRole } from "@/types/auth";
import { StatBlock } from "./StatBlock";

const CHART_COLORS = ["#6b7c3f", "#c9a227", "#9d7a2f", "#8a9a5b", "#b5883a", "#4f5d2e"];

function toInputDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toInputDate(d);
}

const PRESETS: { label: string; range: () => { from: string; to: string } }[] = [
  { label: "اليوم", range: () => ({ from: daysAgo(0), to: daysAgo(0) }) },
  { label: "آخر 7 أيام", range: () => ({ from: daysAgo(6), to: daysAgo(0) }) },
  { label: "آخر 30 يوم", range: () => ({ from: daysAgo(29), to: daysAgo(0) }) },
  {
    label: "هالشهر",
    range: () => {
      const now = new Date();
      return { from: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: daysAgo(0) };
    },
  },
  {
    label: "الشهر الماضي",
    range: () => {
      const now = new Date();
      return {
        from: toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: toInputDate(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    },
  },
];

const ORDER_TYPE_LABELS: Record<string, string> = { dine_in: "صالة", takeaway: "سفري", delivery: "توصيل" };

function expenseLabel(category: string) {
  return EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category;
}

function percent(part: number, total: number) {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "—";
}

function ExportButtons({ type, from, to }: { type: ReportType; from: string; to: string }) {
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  async function handleExport(format: "csv" | "pdf") {
    setExporting(format);
    try {
      await reportsApi.export(type, format, { from, to });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={exporting === "csv"} onClick={() => handleExport("csv")}>
        <Download className="h-3.5 w-3.5" />
        CSV
      </Button>
      <Button variant="outline" size="sm" disabled={exporting === "pdf"} onClick={() => handleExport("pdf")}>
        <FileText className="h-3.5 w-3.5" />
        PDF
      </Button>
    </div>
  );
}

export default function ReportsPage() {
  const [from, setFrom] = useState(daysAgo(29));
  const [to, setTo] = useState(daysAgo(0));
  const range = { from, to };

  const salesQuery = useQuery({ queryKey: ["reports", "sales", range], queryFn: () => reportsApi.sales(range) });
  const topItemsQuery = useQuery({
    queryKey: ["reports", "top-items", range],
    queryFn: () => reportsApi.topItems(range),
  });
  const revenueByCategoryQuery = useQuery({
    queryKey: ["reports", "revenue-by-category", range],
    queryFn: () => reportsApi.revenueByCategory(range),
  });
  const profitQuery = useQuery({ queryKey: ["reports", "profit", range], queryFn: () => reportsApi.profit(range) });
  const staffQuery = useQuery({
    queryKey: ["reports", "staff-performance", range],
    queryFn: () => reportsApi.staffPerformance(range),
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="التقارير" description="تقارير المبيعات والأداء المالي" />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">من تاريخ</Label>
          <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">إلى تاريخ</Label>
          <Input id="to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const r = p.range();
            const active = r.from === from && r.to === to;
            return (
              <Button
                key={p.label}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => {
                  setFrom(r.from);
                  setTo(r.to);
                }}
              >
                {p.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="sales">المبيعات</TabsTrigger>
          <TabsTrigger value="top-items">الأكثر مبيعًا</TabsTrigger>
          <TabsTrigger value="revenue-by-category">حسب التصنيف</TabsTrigger>
          <TabsTrigger value="profit">الأرباح</TabsTrigger>
          <TabsTrigger value="staff">أداء الموظفين</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <ExportButtons type="sales" from={from} to={to} />
          </div>
          {salesQuery.data && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatBlock label="عدد الطلبات" value={String(salesQuery.data.orders_count)} hint="بدون الطلبات الملغية" />
                <StatBlock
                  label="الإيراد الصافي"
                  value={formatCurrency(salesQuery.data.net_revenue)}
                  hint="المبيعات − الاسترجاعات − الضريبة"
                />
                <StatBlock label="متوسط قيمة الطلب" value={formatCurrency(salesQuery.data.average_order_value || 0)} />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatBlock label="إجمالي المبيعات" value={formatCurrency(salesQuery.data.gross_sales)} hint="شامل الضريبة والتوصيل" />
                <StatBlock label="الضريبة المحصّلة" value={formatCurrency(salesQuery.data.tax)} hint="مش إيراد للمطعم" />
                <StatBlock label="الاسترجاعات" value={formatCurrency(salesQuery.data.refunds)} hint="المعتمدة فقط" />
                <StatBlock
                  label="غير المقبوض"
                  value={formatCurrency(salesQuery.data.outstanding)}
                  hint={`المقبوض فعليًا: ${formatCurrency(salesQuery.data.collected)}`}
                />
              </div>
              <div className="h-72 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesQuery.data.by_day}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                    <XAxis dataKey="date" tickFormatter={(d) => formatDate(d, { month: "short", day: "numeric" })} fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v))}
                      labelFormatter={(d) => formatDate(d as string)}
                    />
                    <Line type="monotone" dataKey="net_revenue" name="الإيراد الصافي" stroke="#6b7c3f" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {salesQuery.data.by_order_type.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نوع الطلب</TableHead>
                      <TableHead>عدد الطلبات</TableHead>
                      <TableHead>الإيراد الصافي</TableHead>
                      <TableHead>النسبة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesQuery.data.by_order_type.map((t) => (
                      <TableRow key={t.order_type}>
                        <TableCell className="font-medium">{ORDER_TYPE_LABELS[t.order_type] ?? t.order_type}</TableCell>
                        <TableCell className="tabular">{t.orders_count}</TableCell>
                        <TableCell className="tabular">{formatCurrency(t.net_revenue)}</TableCell>
                        <TableCell className="tabular">{percent(t.net_revenue, salesQuery.data.net_revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="top-items" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <ExportButtons type="top-items" from={from} to={to} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>الكمية المباعة</TableHead>
                <TableHead>الإيرادات (بدون ضريبة)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topItemsQuery.isLoading && <TableEmpty colSpan={3}>جارِ التحميل...</TableEmpty>}
              {topItemsQuery.data?.items.length === 0 && <TableEmpty colSpan={3}>ما في بيانات لهاد المجال</TableEmpty>}
              {topItemsQuery.data?.items.map((item) => (
                <TableRow key={item.menu_item_id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="tabular">{item.quantity_sold}</TableCell>
                  <TableCell className="tabular">{formatCurrency(item.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="revenue-by-category" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <ExportButtons type="revenue-by-category" from={from} to={to} />
          </div>
          <p className="text-xs text-[var(--color-ink-soft)]">
            إيراد الصنف بيشمل الإضافات وبعد توزيع خصم الطلب، بدون ضريبة ولا رسوم توصيل (وقبل الاسترجاعات).
          </p>
          {revenueByCategoryQuery.data && revenueByCategoryQuery.data.categories.length > 0 && (
            <div className="h-72 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByCategoryQuery.data.categories}
                    dataKey="revenue"
                    nameKey="category_name"
                    outerRadius={90}
                    label={(props: { name?: string }) => props.name}
                  >
                    {revenueByCategoryQuery.data.categories.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التصنيف</TableHead>
                <TableHead>الكمية المباعة</TableHead>
                <TableHead>الإيرادات (بدون ضريبة)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueByCategoryQuery.isLoading && <TableEmpty colSpan={3}>جارِ التحميل...</TableEmpty>}
              {revenueByCategoryQuery.data?.categories.length === 0 && (
                <TableEmpty colSpan={3}>ما في بيانات لهاد المجال</TableEmpty>
              )}
              {revenueByCategoryQuery.data?.categories.map((c) => (
                <TableRow key={c.category_id}>
                  <TableCell className="font-medium">{c.category_name}</TableCell>
                  <TableCell className="tabular">{c.quantity_sold}</TableCell>
                  <TableCell className="tabular">{formatCurrency(c.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="profit" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <ExportButtons type="profit" from={from} to={to} />
          </div>
          {profitQuery.data && (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <StatBlock label="الإيراد الصافي" value={formatCurrency(profitQuery.data.revenue)} hint="بدون ضريبة وبعد الاسترجاعات" />
                <StatBlock label="المصاريف" value={formatCurrency(profitQuery.data.expenses)} />
                <StatBlock label="الرواتب" value={formatCurrency(profitQuery.data.payroll)} hint="كشوفات معتمدة أو مدفوعة" />
                <StatBlock label="صافي الربح" value={formatCurrency(profitQuery.data.net_profit)} hint="قبل تكلفة المواد" />
                <StatBlock
                  label="هامش الربح"
                  value={profitQuery.data.revenue > 0 ? `${((profitQuery.data.net_profit / profitQuery.data.revenue) * 100).toFixed(1)}%` : "—"}
                />
              </div>

              <p
                className={
                  "flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm " +
                  (profitQuery.data.net_profit >= 0
                    ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                    : "bg-[var(--color-danger-bg)] text-[var(--color-danger)]")
                }
              >
                {profitQuery.data.net_profit >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {profitQuery.data.net_profit >= 0
                  ? "المطعم رابح خلال هالفترة."
                  : "المصاريف والرواتب أكبر من الإيراد خلال هالفترة."}
              </p>

              {profitQuery.data.expenses_by_category.length === 0 ? (
                <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] bg-white p-8 text-center text-sm text-[var(--color-ink-soft)]">
                  ما في مصاريف مسجّلة بهاد المجال. المصاريف بتنحسب حسب «تاريخ المصروف» اللي بتحدده بصفحة المصاريف. إذا بتسجّل الرواتب كمصروف بفئة «رواتب» وكمان بكشوف الرواتب، رح تنحسب مرتين.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="h-72 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profitQuery.data.expenses_by_category.map((e) => ({ ...e, label: expenseLabel(e.category) }))}
                          dataKey="total"
                          nameKey="label"
                          outerRadius={90}
                          label={(props: { name?: string }) => props.name}
                        >
                          {profitQuery.data.expenses_by_category.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>فئة المصروف</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>من المصاريف</TableHead>
                        <TableHead>من الإيرادات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...profitQuery.data.expenses_by_category]
                        .sort((a, b) => b.total - a.total)
                        .map((e) => (
                          <TableRow key={e.category}>
                            <TableCell className="font-medium">{expenseLabel(e.category)}</TableCell>
                            <TableCell className="tabular">{formatCurrency(e.total)}</TableCell>
                            <TableCell className="tabular">{percent(e.total, profitQuery.data.expenses)}</TableCell>
                            <TableCell className="tabular">{percent(e.total, profitQuery.data.revenue)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="staff" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <ExportButtons type="staff-performance" from={from} to={to} />
          </div>
          {staffQuery.data && staffQuery.data.staff.length > 0 && (
            <div className="h-64 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffQuery.data.staff}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="revenue" name="الإيراد الصافي" fill="#6b7c3f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>عدد الطلبات</TableHead>
                <TableHead>الإيراد الصافي</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffQuery.isLoading && <TableEmpty colSpan={4}>جارِ التحميل...</TableEmpty>}
              {staffQuery.data?.staff.length === 0 && <TableEmpty colSpan={4}>ما في بيانات لهاد المجال</TableEmpty>}
              {staffQuery.data?.staff.map((s) => (
                <TableRow key={s.user_id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-[var(--color-ink-soft)]">{ROLE_LABELS[s.role as UserRole] ?? s.role}</TableCell>
                  <TableCell className="tabular">{s.orders_count}</TableCell>
                  <TableCell className="tabular">{formatCurrency(s.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
