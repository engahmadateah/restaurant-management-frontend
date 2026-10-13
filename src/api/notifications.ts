import { apiClient } from "./client";

export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const notificationsApi = {
  list: (params?: { is_read?: boolean }) =>
    apiClient.get<AppNotification[]>("/notifications", { params }).then((r) => r.data),
  unreadCount: () => apiClient.get<{ unread_count: number }>("/notifications/unread-count").then((r) => r.data),
  markAsRead: (id: number) => apiClient.post<AppNotification>(`/notifications/${id}/mark-read`).then((r) => r.data),
  markAllAsRead: () => apiClient.post<{ message: string }>("/notifications/mark-all-read"),
  remove: (id: number) => apiClient.delete(`/notifications/${id}`),
};
