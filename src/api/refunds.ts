import { apiClient } from "./client";
import type { Refund, RefundStatus } from "@/types/models";

export interface RefundListParams {
  status?: RefundStatus;
  order_id?: number;
}

export interface RefundPayload {
  order_id: number;
  payment_id?: number | null;
  amount: number;
  reason: string;
}

export const refundsApi = {
  list: (params?: RefundListParams) => apiClient.get<Refund[]>("/refunds", { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Refund>(`/refunds/${id}`).then((r) => r.data),
  create: (payload: RefundPayload) => apiClient.post<Refund>("/refunds", payload).then((r) => r.data),
  approve: (id: number, adminNote?: string) =>
    apiClient.post<Refund>(`/refunds/${id}/approve`, { admin_note: adminNote || undefined }).then((r) => r.data),
  reject: (id: number, adminNote?: string) =>
    apiClient.post<Refund>(`/refunds/${id}/reject`, { admin_note: adminNote || undefined }).then((r) => r.data),
};
