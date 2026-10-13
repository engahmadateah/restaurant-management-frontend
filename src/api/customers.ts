import { apiClient } from "./client";
import type { Customer, LoyaltyTransaction, PaginatedResponse } from "@/types/models";

export interface CustomerPayload {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
}

export interface LoyaltyInfo {
  customer_id: number;
  name: string;
  loyalty_points: number;
  transactions: LoyaltyTransaction[];
}

export interface CustomerPageParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export const customersApi = {

  list: (params?: { search?: string }) =>
    apiClient.get<Customer[]>("/customers", { params }).then((r) => r.data),

  page: (params: CustomerPageParams) =>
    apiClient.get<PaginatedResponse<Customer>>("/customers", { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Customer>(`/customers/${id}`).then((r) => r.data),
  create: (payload: CustomerPayload) => apiClient.post<Customer>("/customers", payload).then((r) => r.data),
  update: (id: number, payload: Partial<CustomerPayload>) =>
    apiClient.put<Customer>(`/customers/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/customers/${id}`),
};

export const loyaltyApi = {
  show: (customerId: number) => apiClient.get<LoyaltyInfo>(`/customers/${customerId}/loyalty`).then((r) => r.data),
  adjust: (customerId: number, payload: { points: number; description?: string }) =>
    apiClient
      .post<{ customer_id: number; loyalty_points: number }>(`/customers/${customerId}/loyalty/adjust`, payload)
      .then((r) => r.data),
};
