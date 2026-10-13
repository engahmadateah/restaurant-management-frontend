import { apiClient } from "./client";
import type { MenuItem } from "@/types/models";

export interface InventorySettingsPayload {
  track_stock: boolean;
  stock_quantity?: number | null;
  low_stock_threshold?: number | null;
}

export const inventoryApi = {
  list: () => apiClient.get<MenuItem[]>("/inventory").then((r) => r.data),
  lowStock: () => apiClient.get<MenuItem[]>("/inventory/low-stock").then((r) => r.data),
  restock: (menuItemId: number, quantity: number) =>
    apiClient.post<MenuItem>(`/inventory/${menuItemId}/restock`, { quantity }).then((r) => r.data),
  updateSettings: (menuItemId: number, payload: InventorySettingsPayload) =>
    apiClient.put<MenuItem>(`/inventory/${menuItemId}/settings`, payload).then((r) => r.data),
};
