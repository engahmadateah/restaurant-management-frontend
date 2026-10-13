import { apiClient } from "./client";
import type { FavoriteMenuItem } from "@/types/models";

export const favoritesApi = {

  list: (customerId: number) =>
    apiClient.get<FavoriteMenuItem[]>(`/customers/${customerId}/favorites`).then((r) => r.data),

  add: (customerId: number, menuItemId: number) =>
    apiClient
      .post<FavoriteMenuItem[]>(`/customers/${customerId}/favorites`, { menu_item_id: menuItemId })
      .then((r) => r.data),

  remove: (customerId: number, menuItemId: number) =>
    apiClient.delete<{ message: string }>(`/customers/${customerId}/favorites/${menuItemId}`).then((r) => r.data),
};
