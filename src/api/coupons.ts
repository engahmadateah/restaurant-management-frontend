import { apiClient } from "./client";
import type { Coupon, CouponType } from "@/types/models";

export interface CouponPayload {
  code: string;
  type: CouponType;
  value: number;
  expires_at?: string | null;
  is_active?: boolean;
}

export const couponsApi = {
  list: () => apiClient.get<Coupon[]>("/coupons").then((r) => r.data),
  get: (id: number) => apiClient.get<Coupon>(`/coupons/${id}`).then((r) => r.data),
  create: (payload: CouponPayload) => apiClient.post<Coupon>("/coupons", payload).then((r) => r.data),
  update: (id: number, payload: Partial<CouponPayload>) =>
    apiClient.put<Coupon>(`/coupons/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/coupons/${id}`),

  validate: (code: string) => apiClient.post<Coupon>("/coupons/validate", { code }).then((r) => r.data),
};
