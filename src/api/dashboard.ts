import { apiClient } from "./client";

export interface DashboardTopItem {
  name: string | null;
  quantity: number;
}


export interface DashboardStats {
  categories_count: number;
  menu_items_count: number;
  tables_count: number;
  tables_occupied: number;
  orders_total: number;
  orders_pending: number;
  orders_preparing: number;
  orders_today_count: number;
 
  revenue_today?: number;
  revenue_total?: number;
  gross_sales_today?: number;
  top_items: DashboardTopItem[];
  deliveries_active: number;
  low_stock_items: number;
}

export const dashboardApi = {
  stats: () => apiClient.get<DashboardStats>("/dashboard/stats").then((r) => r.data),
};
