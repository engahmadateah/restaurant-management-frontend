import { apiClient, rethrowBlobError } from "./client";

export interface DateRangeParams {
  from?: string;
  to?: string;
}


export interface SalesFigures {
  orders_count: number;
  gross_sales: number;
  tax: number;
  refunds: number;
  net_revenue: number;
  revenue: number;
  collected: number;
  outstanding: number;
  average_order_value: number;
}

export interface SalesReport extends SalesFigures {
  from: string;
  to: string;
  by_day: ({ date: string } & SalesFigures)[];
  by_order_type: ({ order_type: string } & SalesFigures)[];
}

export interface TopItemsReport {
  from: string;
  to: string;
  items: { menu_item_id: number; name: string; quantity_sold: number; revenue: number }[];
}

export interface RevenueByCategoryReport {
  from: string;
  to: string;
  categories: { category_id: number; category_name: string; revenue: number; quantity_sold: number }[];
}


export interface ProfitReport {
  from: string;
  to: string;
  revenue: number;
  net_revenue: number;
  gross_sales: number;
  tax: number;
  refunds: number;
  expenses: number;
  payroll: number;
  total_costs: number;
  net_profit: number;
  expenses_by_category: { category: string; total: number }[];
}

export interface StaffPerformanceReport {
  from: string;
  to: string;
  staff: { user_id: number; name: string; role: string; orders_count: number; revenue: number; gross_sales?: number }[];
}

// تقرير نهاية اليوم (App\Services\ZReport)
export interface ZReport {
  date: string;
  sales: {
    orders_count: number;
    gross_sales: number;
    discounts: number;
    delivery_fees: number;
    tax: number;
    outstanding: number;
    cancelled_orders: number;
  };
  payments: {
    by_method: { method: "cash" | "card" | "online"; count: number; total: number; change_given: number }[];
    collected: number;
  };
  refunds: { count: number; total: number; cash_total: number };
  net_collected: number;
  // حركات نقدية انسجّلت بهاليوم على أي صندوق (مصاريف/سحوبات/إيداعات)
  cash_movements: { count: number; expenses: number; withdrawals: number; deposits: number };
  drawers: {
    count: number;
    open_now: number;
    shortage: number;
    overage: number;
    net_difference: number;
    items: {
      id: number;
      user: string | null;
      opened_at: string;
      closed_at: string;
      opening_float: number;
      cash_sales: number;
      cash_refunds: number;
      cash_expenses: number;
      cash_withdrawals: number;
      cash_deposits: number;
      expected_cash: number;
      counted_cash: number;
      difference: number;
    }[];
  };
}

export type ReportType = "sales" | "top-items" | "revenue-by-category" | "profit" | "staff-performance";

// Laravel بيرجع نتائج SUM()/COUNT() كنصوص (مثلاً "150000.00") على MySQL،
// والرسوم البيانية ما بتقدر ترسم نص — هاد كان سبب إن المصاريف ما كانت تظهر
// بتقرير الأرباح. فبنحوّل كل القيم الرقمية لأرقام فعلية هون، مرة وحدة، لكل الصفحات.
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function figures(d: Partial<Record<keyof SalesFigures, unknown>>): SalesFigures {
  const net = num(d.net_revenue ?? d.revenue);
  return {
    orders_count: num(d.orders_count),
    gross_sales: num(d.gross_sales),
    tax: num(d.tax),
    refunds: num(d.refunds),
    net_revenue: net,
    revenue: net,
    collected: num(d.collected),
    outstanding: num(d.outstanding),
    average_order_value: num(d.average_order_value),
  };
}

export const reportsApi = {
  sales: (params?: DateRangeParams) =>
    apiClient.get<SalesReport>("/reports/sales", { params }).then(({ data }): SalesReport => ({
      ...data,
      ...figures(data),
      by_day: (data.by_day ?? []).map((d) => ({ ...d, ...figures(d) })),
      by_order_type: (data.by_order_type ?? []).map((d) => ({ ...d, ...figures(d) })),
    })),
  topItems: (params?: DateRangeParams & { limit?: number }) =>
    apiClient.get<TopItemsReport>("/reports/top-items", { params }).then(({ data }): TopItemsReport => ({
      ...data,
      items: (data.items ?? []).map((i) => ({ ...i, quantity_sold: num(i.quantity_sold), revenue: num(i.revenue) })),
    })),
  revenueByCategory: (params?: DateRangeParams) =>
    apiClient
      .get<RevenueByCategoryReport>("/reports/revenue-by-category", { params })
      .then(({ data }): RevenueByCategoryReport => ({
        ...data,
        categories: (data.categories ?? []).map((c) => ({
          ...c,
          revenue: num(c.revenue),
          quantity_sold: num(c.quantity_sold),
        })),
      })),
  profit: (params?: DateRangeParams) =>
    apiClient.get<ProfitReport>("/reports/profit", { params }).then(({ data }): ProfitReport => ({
      ...data,
      revenue: num(data.net_revenue ?? data.revenue),
      net_revenue: num(data.net_revenue ?? data.revenue),
      gross_sales: num(data.gross_sales),
      tax: num(data.tax),
      refunds: num(data.refunds),
      expenses: num(data.expenses),
      payroll: num(data.payroll),
      total_costs: num(data.total_costs ?? num(data.expenses) + num(data.payroll)),
      net_profit: num(data.net_profit),
      expenses_by_category: (data.expenses_by_category ?? []).map((e) => ({ ...e, total: num(e.total) })),
    })),
  staffPerformance: (params?: DateRangeParams) =>
    apiClient
      .get<StaffPerformanceReport>("/reports/staff-performance", { params })
      .then(({ data }): StaffPerformanceReport => ({
        ...data,
        staff: (data.staff ?? []).map((s) => ({ ...s, orders_count: num(s.orders_count), revenue: num(s.revenue) })),
      })),
  export: async (type: ReportType, format: "csv" | "pdf", params?: DateRangeParams) => {
    const response = await apiClient.get("/reports/export", {
      params: { type, format, ...params },
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data as Blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${type}.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },
  zReport: (date?: string) =>
    apiClient.get<ZReport>("/reports/z-report", { params: { date } }).then((r) => r.data),
  zReportPdf: (date?: string) =>
    apiClient
      .get("/reports/z-report/pdf", { params: { date }, responseType: "blob" })
      .then((r) => r.data as Blob)
      .catch(rethrowBlobError),
};
