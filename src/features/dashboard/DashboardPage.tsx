import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import {
  ShoppingBag,
  DollarSign,
  Flame,
  AlertTriangle,
  Utensils,
  Truck,
  TrendingUp,
  Receipt,
  Star,
  Settings,
  Phone,
  MapPin,
  Percent,
  Gift,
  Coins,
  Activity,
  PieChart as PieChartIcon,
  ChevronLeft,
} from "lucide-react";
import { dashboardApi } from "@/api/dashboard";
import { reportsApi } from "@/api/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { usePermissions } from "@/hooks/usePermissions";
import { QuickActions } from "./QuickActions";
import { cn } from "@/lib/utils";


const CATEGORY_COLORS = [
  "var(--color-wine-600)",
  "var(--color-gold-500)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-wine-300)",
  "var(--color-gold-300)",
];

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - (days - 1));
  return d.toISOString().slice(0, 10);
}

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function truncateLabel(name: string, max = 14) {
  return name.length > max ? `${name.slice(0, max)}…` : name;
}


type StatTone = "wine" | "gold" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<StatTone, string> = {
  wine: "bg-[var(--color-wine-50)] text-[var(--color-wine-600)]",
  gold: "bg-[var(--color-gold-100)] text-[var(--color-gold-600)]",
  success: "bg-[var(--color-success-bg)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
  danger: "bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
  info: "bg-[var(--color-info-bg)] text-[var(--color-info)]",
};

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  tone = "wine",
  href,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  loading: boolean;
  tone?: StatTone;
  href?: string;
}) {
  const body = (
    <Card className={cn(href && "transition-shadow hover:shadow-[var(--shadow-lift)]")}>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-[var(--color-ink-soft)]">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-[var(--color-paper-dim)]" />
          ) : (
            <p className="tabular mt-1 text-2xl font-semibold text-[var(--color-ink)]">{value}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
            TONE_CLASSES[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link to={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}


function MiniStat({ label, value, loading }: { label: string; value: string; loading: boolean }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
      <p className="text-xs text-[var(--color-ink-soft)]">{label}</p>
      {loading ? (
        <div className="mt-1.5 h-5 w-16 animate-pulse rounded bg-[var(--color-paper-dim)]" />
      ) : (
        <p className="tabular mt-1 text-lg font-semibold text-[var(--color-ink)]">{value}</p>
      )}
    </div>
  );
}


function PeriodToggle({ value, onChange }: { value: 7 | 30; onChange: (v: 7 | 30) => void }) {
  return (
    <div className="flex gap-1.5">
      {([7, 30] as const).map((p) => (
        <Button key={p} type="button" size="sm" variant={value === p ? "gold" : "outline"} onClick={() => onChange(p)}>
          {p} يوم
        </Button>
      ))}
    </div>
  );
}


function SettingsSnapshotCard() {
  const settings = useSettingsStore((s) => s.settings);
  const { hasPermission } = usePermissions();

  const taxRateNum = parseFloat(settings.tax_rate ?? "");
  const taxRateDisplay = Number.isFinite(taxRateNum) ? `${Math.round(taxRateNum * 100)}%` : "—";
  const loyaltyRate = settings.loyalty_points_per_currency;

  const rows: { icon: typeof Phone; label: string; value: string }[] = [
    { icon: Phone, label: "رقم الهاتف", value: settings.phone || "—" },
    { icon: MapPin, label: "العنوان", value: settings.address || "—" },
    { icon: Coins, label: "رمز العملة", value: settings.currency || "—" },
    { icon: Percent, label: "نسبة الضريبة", value: taxRateDisplay },
    {
      icon: Truck,
      label: "رسوم التوصيل",
      value: settings.delivery_fee ? formatCurrency(settings.delivery_fee) : "—",
    },
    {
      icon: Gift,
      label: "نقاط الولاء",
      value: loyaltyRate ? `${loyaltyRate} نقطة لكل ${settings.currency || "وحدة"}` : "—",
    },
  ];

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-[var(--color-wine-600)]" />
          لمحة عن الإعدادات
        </CardTitle>
        {hasPermission("settings.manage") && (
          <Button asChild variant="ghost" size="sm">
            <Link to="/settings">
              تعديل
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center gap-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-[var(--color-ink-soft)]">
              <row.icon className="h-3.5 w-3.5 shrink-0" />
              {row.label}
            </span>
            <span className="tabular truncate font-medium text-[var(--color-ink)]">{row.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const restaurantName = useSettingsStore((s) => s.settings.restaurant_name) || "المطعم";
  const { hasPermission } = usePermissions();
  const canViewReports = hasPermission("reports.view");
  const [period, setPeriod] = useState<7 | 30>(7);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardApi.stats,
   
    refetchInterval: 30_000,
  });

  const range = { from: isoDaysAgo(period), to: isoToday() };


  const salesTrendQuery = useQuery({
    queryKey: ["dashboard-sales-trend", range.from, range.to],
    queryFn: () => reportsApi.sales(range),
    enabled: canViewReports,
  });

  const revenueByCategoryQuery = useQuery({
    queryKey: ["dashboard-revenue-by-category", range.from, range.to],
    queryFn: () => reportsApi.revenueByCategory(range),
    enabled: canViewReports,
  });


  const activeOrders = (data?.orders_pending ?? 0) + (data?.orders_preparing ?? 0);
  const lowStockCount = data?.low_stock_items ?? 0;

  const topItems = data?.top_items ?? [];

  const totalOrders = data?.orders_total ?? 0;
  const otherOrders = Math.max(totalOrders - (data?.orders_pending ?? 0) - (data?.orders_preparing ?? 0), 0);
  const orderStatusData = [
    { name: "قيد الانتظار", value: data?.orders_pending ?? 0, color: "var(--color-warning)" },
    { name: "قيد التحضير", value: data?.orders_preparing ?? 0, color: "var(--color-info)" },
    { name: "طلبات أخرى", value: otherOrders, color: "var(--color-success)" },
  ].filter((slice) => slice.value > 0);

  const categories = revenueByCategoryQuery.data?.categories ?? [];
  const sortedCategories = [...categories].sort((a, b) => b.revenue - a.revenue);
  const colorForCategory = (id: number) => {
    const idx = categories.findIndex((c) => c.category_id === id);
    return CATEGORY_COLORS[(idx < 0 ? 0 : idx) % CATEGORY_COLORS.length];
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">
          أهلاً {user?.name?.split(" ")[0] ?? ""}
        </h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          هاي نظرة سريعة على أداء {restaurantName} اليوم
        </p>
      </div>

      <QuickActions />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {canViewReports && (
          <StatCard
            label="الإيراد الصافي اليوم"
            value={formatCurrency(data?.revenue_today ?? 0)}
            icon={DollarSign}
            loading={isLoading}
            tone="gold"
          />
        )}
        <StatCard
          label="طلبات اليوم"
          value={String(data?.orders_today_count ?? 0)}
          icon={ShoppingBag}
          loading={isLoading}
          tone="wine"
        />
        <StatCard
          label="طلبات نشطة"
          value={String(activeOrders)}
          icon={Flame}
          loading={isLoading}
          tone={activeOrders > 0 ? "warning" : "wine"}
        />
        <StatCard
          label="أصناف منخفضة المخزون"
          value={String(lowStockCount)}
          icon={AlertTriangle}
          loading={isLoading}
          tone={lowStockCount > 0 ? "danger" : "success"}
          href={hasPermission("menu.manage") ? "/inventory" : undefined}
        />
        <StatCard
          label="الطاولات المشغولة"
          value={`${data?.tables_occupied ?? 0} / ${data?.tables_count ?? 0}`}
          icon={Utensils}
          loading={isLoading}
          tone="info"
        />
        <StatCard
          label="توصيلات جارية"
          value={String(data?.deliveries_active ?? 0)}
          icon={Truck}
          loading={isLoading}
          tone="info"
        />
        {canViewReports && (
          <StatCard
            label="إجمالي الإيراد الصافي"
            value={formatCurrency(data?.revenue_total ?? 0)}
            icon={TrendingUp}
            loading={isLoading}
            tone="gold"
          />
        )}
        <StatCard
          label="إجمالي الطلبات"
          value={String(data?.orders_total ?? 0)}
          icon={Receipt}
          loading={isLoading}
          tone="wine"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SettingsSnapshotCard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-info)]" />
              حالة الطلبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-paper-dim)]" />
            ) : totalOrders === 0 ? (
              <p className="py-14 text-center text-sm text-[var(--color-ink-soft)]">ما في طلبات مسجّلة لسه</p>
            ) : (
              <>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={38}
                        outerRadius={64}
                        paddingAngle={2}
                      >
                        {orderStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${Number(v)} طلب`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                  {orderStatusData.map((entry) => (
                    <span key={entry.name} className="flex items-center gap-1.5 text-xs text-[var(--color-ink-soft)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      {entry.name} ({entry.value})
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[var(--color-gold-500)]" />
              الأكثر مبيعًا
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-48 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-paper-dim)]" />
            ) : topItems.length === 0 ? (
              <p className="py-14 text-center text-sm text-[var(--color-ink-soft)]">
                ما في مبيعات كفاية لعرض ترتيب لسه
              </p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={96}
                      fontSize={12}
                      tickFormatter={(v: string | null) => truncateLabel(v ?? "صنف محذوف")}
                    />
                    <Tooltip
                      formatter={(v) => `${Number(v)} قطعة`}
                      labelFormatter={(v) => (v as string | null) ?? "صنف محذوف"}
                    />
                    <Bar dataKey="quantity" fill="var(--color-gold-500)" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canViewReports && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[var(--color-wine-600)]" />
              اتجاه الإيرادات والطلبات
            </CardTitle>
            <PeriodToggle value={period} onChange={setPeriod} />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              <MiniStat
                label="عدد الطلبات"
                value={String(salesTrendQuery.data?.orders_count ?? 0)}
                loading={salesTrendQuery.isLoading}
              />
              <MiniStat
                label="الإيراد الصافي"
                value={formatCurrency(salesTrendQuery.data?.net_revenue ?? 0)}
                loading={salesTrendQuery.isLoading}
              />
              <MiniStat
                label="متوسط قيمة الطلب"
                value={formatCurrency(salesTrendQuery.data?.average_order_value ?? 0)}
                loading={salesTrendQuery.isLoading}
              />
            </div>

            {salesTrendQuery.isLoading ? (
              <div className="h-64 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-paper-dim)]" />
            ) : !salesTrendQuery.data || salesTrendQuery.data.by_day.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--color-ink-soft)]">
                ما في بيانات مبيعات كفاية لهاد الفترة
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesTrendQuery.data.by_day}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => formatDate(d, { month: "short", day: "numeric" })}
                      fontSize={12}
                    />
                    <YAxis yAxisId="revenue" fontSize={12} />
                    <YAxis yAxisId="orders" orientation="right" fontSize={12} allowDecimals={false} />
                    <Tooltip
                      labelFormatter={(d) => formatDate(d as string)}
                      formatter={(value, name) =>
                        
                        name === "عدد الطلبات"
                          ? [`${Number(value)} طلب`, "عدد الطلبات"]
                          : [formatCurrency(Number(value)), "الإيرادات"]
                      }
                    />
                    <Legend />
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name="الإيرادات"
                      stroke="var(--color-wine-600)"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orders_count"
                      name="عدد الطلبات"
                      stroke="var(--color-gold-500)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {canViewReports && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-[var(--color-gold-500)]" />
              الإيرادات حسب التصنيف ({period === 7 ? "آخر ٧ أيام" : "آخر ٣٠ يوم"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByCategoryQuery.isLoading ? (
              <div className="h-64 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-paper-dim)]" />
            ) : categories.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--color-ink-soft)]">ما في بيانات لهاد الفترة</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 md:items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categories} dataKey="revenue" nameKey="category_name" outerRadius={90}>
                        {categories.map((c) => (
                          <Cell key={c.category_id} fill={colorForCategory(c.category_id)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ol className="flex flex-col gap-2">
                  {sortedCategories.map((c) => (
                    <li key={c.category_id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: colorForCategory(c.category_id) }}
                        />
                        {c.category_name}
                      </span>
                      <span className="tabular text-[var(--color-ink-soft)]">{formatCurrency(c.revenue)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
