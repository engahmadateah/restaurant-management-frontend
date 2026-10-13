import { apiClient } from "./client";
import type { Currency } from "@/types/models";

export interface CurrencyPayload {
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_active?: boolean;
}

export const currenciesApi = {
  list: (params?: { active_only?: boolean }) =>
    apiClient.get<Currency[]>("/currencies", { params }).then((r) => r.data),

  create: (payload: CurrencyPayload) => apiClient.post<Currency>("/currencies", payload).then((r) => r.data),
  update: (id: number, payload: Partial<Omit<CurrencyPayload, "code">>) =>
    apiClient.put<Currency>(`/currencies/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/currencies/${id}`),
  setDefault: (id: number) => apiClient.post<Currency>(`/currencies/${id}/set-default`).then((r) => r.data),
};
