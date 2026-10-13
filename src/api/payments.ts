import { apiClient } from "./client";
import type { PaginatedResponse, Payment, PaymentMethod } from "@/types/models";
import { idempotencyHeaders } from "@/lib/idempotency";

export interface PaymentPayload {
  order_id: number;
  method: PaymentMethod;
  amount: number;
 
  tendered_amount?: number;
}

export type PaymentWithOrder = Payment & {
  order?: { id: number; order_number: string; total: string; payment_status?: string } | null;
};

export interface PaymentListParams {
  method?: PaymentMethod;
  status?: "paid" | "pending" | "refunded";
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}


export interface PaymentsSummary {
  paid_total: number;
  cash_total: number;
  card_total: number;
  online_total: number;
}

export type PaymentsPage = PaginatedResponse<PaymentWithOrder> & { summary: PaymentsSummary };

export const paymentsApi = {
 
  page: (params?: PaymentListParams) => apiClient.get<PaymentsPage>("/payments", { params }).then((r) => r.data),
  list: (orderId: number) => apiClient.get<Payment[]>("/payments", { params: { order_id: orderId } }).then((r) => r.data),
  create: (payload: PaymentPayload, idempotencyKey?: string) =>
    apiClient
      .post<Payment>("/payments", payload, { headers: idempotencyHeaders(idempotencyKey) })
      .then((r) => r.data),

  remove: (id: number) => apiClient.delete(`/payments/${id}`),
};
