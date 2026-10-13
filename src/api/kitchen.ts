import { apiClient } from "./client";
import type { Order } from "@/types/models";

export const kitchenApi = {
 
  queue: () => apiClient.get<Order[]>("/kitchen/queue").then((r) => r.data),
  start: (orderId: number) => apiClient.post<Order>(`/kitchen/orders/${orderId}/start`).then((r) => r.data),
  ready: (orderId: number) => apiClient.post<Order>(`/kitchen/orders/${orderId}/ready`).then((r) => r.data),

  serve: (orderId: number) => apiClient.post<Order>(`/kitchen/orders/${orderId}/serve`).then((r) => r.data),
};
