import { apiClient } from "./client";
import type { MenuItem, Translations } from "@/types/models";

export interface MenuItemPayload {
  category_id: number;
  name: string;
  description?: string | null;
  price: number;

  tax_rate?: number | null;

  translations?: Translations | null;
  is_available?: boolean;
  sort_order?: number;
}

export const menuItemsApi = {
  list: (params?: {
    category_id?: number;
    available_only?: boolean;
    
    lang?: string;
    currency?: string;
  }) => apiClient.get<MenuItem[]>("/menu-items", { params }).then((r) => r.data),
  create: (payload: MenuItemPayload) => apiClient.post<MenuItem>("/menu-items", payload).then((r) => r.data),
  update: (id: number, payload: Partial<MenuItemPayload>) =>
    apiClient.put<MenuItem>(`/menu-items/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/menu-items/${id}`),
  uploadImage: (id: number, file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiClient
      .post<MenuItem>(`/menu-items/${id}/image`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
