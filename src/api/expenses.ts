import { apiClient } from "./client";
import type { Expense, ExpenseCategory } from "@/types/models";

export interface ExpensePayload {
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes?: string;
}

export interface ExpenseListParams {
  category?: ExpenseCategory;
  from?: string;
  to?: string;
  per_page?: number | "all";
  page?: number;
}


export interface ExpenseListResponse {
  data: Expense[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total: number;
}

export const expensesApi = {
  list: (params?: ExpenseListParams) =>
    apiClient.get<ExpenseListResponse>("/expenses", { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Expense>(`/expenses/${id}`).then((r) => r.data),
  create: (payload: ExpensePayload) => apiClient.post<Expense>("/expenses", payload).then((r) => r.data),
  update: (id: number, payload: Partial<ExpensePayload>) =>
    apiClient.put<Expense>(`/expenses/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/expenses/${id}`),
};
