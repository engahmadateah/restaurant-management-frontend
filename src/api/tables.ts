import { apiClient } from "./client";
import type { RestaurantTable, TableStatus } from "@/types/models";

export interface TablePayload {
  table_number: string;
  capacity: number;
  status: TableStatus;
}

export interface TableQr {
  table_id: number;
  table_number: string;
  token: string;
}

export const tablesApi = {
  list: () => apiClient.get<RestaurantTable[]>("/tables").then((r) => r.data),
  get: (id: number) => apiClient.get<RestaurantTable>(`/tables/${id}`).then((r) => r.data),
  create: (payload: TablePayload) => apiClient.post<RestaurantTable>("/tables", payload).then((r) => r.data),
  update: (id: number, payload: Partial<TablePayload>) =>
    apiClient.put<RestaurantTable>(`/tables/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/tables/${id}`),
  
  qr: (id: number) => apiClient.get<TableQr>(`/tables/${id}/qr`).then((r) => r.data),
  rotateQr: (id: number) => apiClient.post<TableQr>(`/tables/${id}/qr/rotate`).then((r) => r.data),
};