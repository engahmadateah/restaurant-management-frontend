import { apiClient } from "./client";
import type { Reservation, ReservationStatus } from "@/types/models";

export interface ReservationPayload {
  table_id?: number | null;
  customer_id?: number | null;
  customer_name?: string;
  customer_phone?: string;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  notes?: string;
}

export interface ReservationListParams {
  status?: ReservationStatus;
  date?: string;
  table_id?: number;
}

export const reservationsApi = {
  list: (params?: ReservationListParams) =>
    apiClient.get<Reservation[]>("/reservations", { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Reservation>(`/reservations/${id}`).then((r) => r.data),
  create: (payload: ReservationPayload) =>
    apiClient.post<Reservation>("/reservations", payload).then((r) => r.data),
  update: (id: number, payload: Partial<ReservationPayload> & { status?: ReservationStatus }) =>
    apiClient.put<Reservation>(`/reservations/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/reservations/${id}`),
  confirm: (id: number) => apiClient.post<Reservation>(`/reservations/${id}/confirm`).then((r) => r.data),
  cancel: (id: number, reason?: string) =>
    apiClient.post<Reservation>(`/reservations/${id}/cancel`, { reason }).then((r) => r.data),
  complete: (id: number) => apiClient.post<Reservation>(`/reservations/${id}/complete`).then((r) => r.data),

  noShow: (id: number) => apiClient.post<Reservation>(`/reservations/${id}/no-show`).then((r) => r.data),
};
