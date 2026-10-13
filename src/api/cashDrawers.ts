import { apiClient } from "./client";
import type { ExpenseCategory, PaginatedResponse } from "@/types/models";
import { idempotencyHeaders } from "@/lib/idempotency";

export interface CashDrawerByMethod {
  count: number;
  total: number;
}


export interface CashDrawer {
  id: number;
  user_id: number;
  user?: { id: number; name: string; role: string };
  closed_by: number | null;
  closer?: { id: number; name: string } | null;
  opening_float: string;
  opened_at: string;
  closed_at: string | null;

  cash_sales: string | number | null;
  cash_refunds: string | number | null;
  
  cash_expenses?: string | number | null;
  cash_withdrawals?: string | number | null;
  cash_deposits?: string | number | null;
  expected_cash: string | number | null;
  counted_cash: string | null;
  difference: string | null;
  notes: string | null;
  by_method?: Partial<Record<"cash" | "card" | "online", CashDrawerByMethod>>;
  is_stale?: boolean;
}

export type CashMovementType = "expense" | "withdrawal" | "deposit";

export interface CashMovement {
  id: number;
  cash_drawer_id: number;
  user_id: number | null;
  user?: { id: number; name: string } | null;
  type: CashMovementType;
  amount: string;
  reason: string;
  expense_id: number | null;
  expense?: { id: number; category: ExpenseCategory } | null;
  created_at: string;
}

export interface CashMovementTotals {
  expenses: number;
  withdrawals: number;
  deposits: number;
}

export interface CashMovementPayload {
  type: CashMovementType;
  amount: number;
  reason: string;
  
  category?: ExpenseCategory;
}

export interface CashDrawerListParams {
  status?: "open" | "closed";
  user_id?: number;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export const cashDrawersApi = {
  current: () => apiClient.get<{ drawer: CashDrawer | null }>("/cash-drawers/current").then((r) => r.data.drawer),
  list: (params?: CashDrawerListParams) =>
    apiClient.get<PaginatedResponse<CashDrawer>>("/cash-drawers", { params }).then((r) => r.data),
  open: (openingFloat: number, idempotencyKey?: string) =>
    apiClient
      .post<CashDrawer>("/cash-drawers/open", { opening_float: openingFloat }, { headers: idempotencyHeaders(idempotencyKey) })
      .then((r) => r.data),
  close: (id: number, payload: { counted_cash: number; notes?: string }, idempotencyKey?: string) =>
    apiClient
      .post<CashDrawer>(`/cash-drawers/${id}/close`, payload, { headers: idempotencyHeaders(idempotencyKey) })
      .then((r) => r.data),
  movements: (drawerId: number) =>
    apiClient
      .get<{ data: CashMovement[]; totals: CashMovementTotals }>(`/cash-drawers/${drawerId}/movements`)
      .then((r) => r.data),
  addMovement: (drawerId: number, payload: CashMovementPayload, idempotencyKey?: string) =>
    apiClient
      .post<CashMovement>(`/cash-drawers/${drawerId}/movements`, payload, { headers: idempotencyHeaders(idempotencyKey) })
      .then((r) => r.data),
  deleteMovement: (drawerId: number, movementId: number) =>
    apiClient.delete<{ message: string }>(`/cash-drawers/${drawerId}/movements/${movementId}`).then((r) => r.data),
};
