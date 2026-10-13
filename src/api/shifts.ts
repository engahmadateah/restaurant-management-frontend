import { apiClient } from "./client";
import type { Shift } from "@/types/models";

export interface ShiftListParams {
  user_id?: number;
  from?: string;
  to?: string;

  auto_closed?: boolean;
}

export interface ShiftUpdatePayload {
  clock_in: string;
  clock_out: string;
  notes?: string | null;
}

export const shiftsApi = {
  list: (params?: ShiftListParams) => apiClient.get<Shift[]>("/shifts", { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Shift>(`/shifts/${id}`).then((r) => r.data),
  clockIn: (notes?: string) => apiClient.post<Shift>("/shifts/clock-in", { notes }).then((r) => r.data),

  update: (id: number, payload: ShiftUpdatePayload) =>
    apiClient.put<Shift>(`/shifts/${id}`, payload).then((r) => r.data),
  clockOut: (notes?: string) => apiClient.post<Shift>("/shifts/clock-out", { notes }).then((r) => r.data),
};
