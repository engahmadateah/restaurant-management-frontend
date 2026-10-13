import { apiClient } from "./client";
import type { Review } from "@/types/models";

export interface ReviewListParams {
  is_approved?: boolean;
  rating?: number;
  menu_item_id?: number;
}


export interface RatingSummary {
  menu_item_id: number;
  average_rating: number;
  total_reviews: number;
  breakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface ReviewCreatePayload {
  menu_item_id: number;
  customer_id?: number | null;
  order_id?: number | null;
  rating: number;
  comment?: string | null;
}

export interface ReviewUpdatePayload {
  rating?: number;
  comment?: string | null;
  is_approved?: boolean;
}

export const reviewsApi = {
  list: (params?: ReviewListParams) => apiClient.get<Review[]>("/reviews", { params }).then((r) => r.data),
  create: (payload: ReviewCreatePayload) => apiClient.post<Review>("/reviews", payload).then((r) => r.data),
  update: (id: number, payload: ReviewUpdatePayload) =>
    apiClient.put<Review>(`/reviews/${id}`, payload).then((r) => r.data),
  approve: (id: number) => apiClient.post<Review>(`/reviews/${id}/approve`).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/reviews/${id}`),
  ratingSummary: (menuItemId: number) =>
    apiClient.get<RatingSummary>(`/menu-items/${menuItemId}/rating-summary`).then((r) => r.data),
};
