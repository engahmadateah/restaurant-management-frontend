import { apiClient } from "./client";
import type { Category, Translations } from "@/types/models";

export interface CategoryPayload {
  name: string;
  slug: string;
  is_active?: boolean;
  sort_order?: number;
  
  tax_rate?: number | null;

  translations?: Translations | null;
}

export const categoriesApi = {

  list: (params?: { lang?: string }) => apiClient.get<Category[]>("/categories", { params }).then((r) => r.data),
  create: (payload: CategoryPayload) => apiClient.post<Category>("/categories", payload).then((r) => r.data),
  update: (id: number, payload: Partial<CategoryPayload>) =>
    apiClient.put<Category>(`/categories/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/categories/${id}`),
};
