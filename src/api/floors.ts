import { apiClient } from "./client";
import type { Floor, RestaurantTable } from "@/types/models";

export interface FloorPayload {
  name: string;
  canvas_width?: number;
  canvas_height?: number;
  sort_order?: number;
  is_active?: boolean;
}

export interface TablePositionPayload {
  floor_id?: number | null;
  pos_x: number;
  pos_y: number;
  width?: number;
  height?: number;
  rotation?: number;
  shape?: RestaurantTable["shape"];
}

export interface BulkPositionItem {
  id: number;
  pos_x: number;
  pos_y: number;
  rotation?: number;
}

export const floorsApi = {

  list: () => apiClient.get<Floor[]>("/floors").then((r) => r.data),
  get: (id: number) => apiClient.get<Floor>(`/floors/${id}`).then((r) => r.data),
  create: (payload: FloorPayload) => apiClient.post<Floor>("/floors", payload).then((r) => r.data),
  update: (id: number, payload: Partial<FloorPayload>) =>
    apiClient.put<Floor>(`/floors/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/floors/${id}`),


  updateTablePosition: (tableId: number, payload: TablePositionPayload) =>
    apiClient.put<RestaurantTable>(`/tables/${tableId}/position`, payload).then((r) => r.data),


  bulkUpdatePositions: (tables: BulkPositionItem[]) =>
    apiClient.post<{ message: string }>("/tables/positions/bulk", { tables }).then((r) => r.data),
};
