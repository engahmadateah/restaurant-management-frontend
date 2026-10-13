import { apiClient } from "./client";
import type { DeliveryStatus, Order } from "@/types/models";

export const deliveriesApi = {
  list: () => apiClient.get<Order[]>("/deliveries").then((r) => r.data),
  assignDriver: (orderId: number, driverId: number) =>
    apiClient.post<Order>(`/orders/${orderId}/assign-driver`, { driver_id: driverId }).then((r) => r.data),
  updateStatus: (orderId: number, status: Extract<DeliveryStatus, "out_for_delivery" | "delivered">) =>
    apiClient.post<Order>(`/orders/${orderId}/delivery-status`, { delivery_status: status }).then((r) => r.data),
};
