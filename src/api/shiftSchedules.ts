import { apiClient } from "./client";
import type { PaginatedResponse, ShiftSchedule, ShiftScheduleStatus } from "@/types/models";

export interface ShiftScheduleListParams {
  user_id?: number;
  status?: ShiftScheduleStatus;
  from?: string;
  to?: string;
  per_page?: number | "all";
  page?: number;
}

export interface ShiftSchedulePayload {
  user_id: number;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export const shiftSchedulesApi = {
  list: (params?: ShiftScheduleListParams) =>
    apiClient.get<PaginatedResponse<ShiftSchedule>>("/shift-schedules", { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<ShiftSchedule>(`/shift-schedules/${id}`).then((r) => r.data),
  create: (payload: ShiftSchedulePayload) =>
    apiClient.post<ShiftSchedule>("/shift-schedules", payload).then((r) => r.data),
  update: (id: number, payload: Partial<ShiftSchedulePayload> & { status?: ShiftScheduleStatus }) =>
    apiClient.put<ShiftSchedule>(`/shift-schedules/${id}`, payload).then((r) => r.data),
  
  setStatus: (id: number, status: "confirmed" | "cancelled") =>
    apiClient.put<ShiftSchedule>(`/shift-schedules/${id}`, { status }).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/shift-schedules/${id}`),
};
