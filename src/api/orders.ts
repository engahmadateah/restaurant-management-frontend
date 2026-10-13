import { apiClient } from "./client";
import type { Order, OrderSource, OrderStatus, OrderType, PaginatedResponse, PaymentStatus } from "@/types/models";
import { idempotencyHeaders } from "@/lib/idempotency";

export interface OrderItemPayload {
  menu_item_id: number;
  quantity: number;
  notes?: string;
  modifiers?: number[];
}

export interface OrderPayload {
  table_id?: number | null;
  customer_id?: number | null;
  coupon_code?: string;
  order_type: OrderType;
  delivery_address?: string;
  delivery_phone?: string;
  redeem_points?: number;
  notes?: string;
  items: OrderItemPayload[];
}

export interface OrderListParams {
  status?: OrderStatus;
  order_type?: OrderType;
 
  payment_status?: PaymentStatus | "outstanding";

  source?: OrderSource;
 
  from?: string;
  to?: string;

  search?: string;
  per_page?: number | "all";
  page?: number;
}


export interface OrderListSummary {
  counts: Partial<Record<OrderStatus, number>>;
  revenue: number;
  unpaid: number;
}

export type PaginatedOrders = PaginatedResponse<Order> & { summary?: OrderListSummary };

export const ordersApi = {

  list: (params?: OrderListParams) =>
    apiClient.get<PaginatedOrders | Order[]>("/orders", { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Order>(`/orders/${id}`).then((r) => r.data),

  create: (payload: OrderPayload, idempotencyKey?: string, options?: { timeoutMs?: number }) =>
    apiClient
      .post<Order>("/orders", payload, { headers: idempotencyHeaders(idempotencyKey), timeout: options?.timeoutMs })
      .then((r) => r.data),
  updateStatus: (id: number, status: OrderStatus) =>
    apiClient.put<Order>(`/orders/${id}`, { status }).then((r) => r.data),
  updateNotes: (id: number, notes: string) =>
    apiClient.put<Order>(`/orders/${id}`, { notes }).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/orders/${id}`),
};
