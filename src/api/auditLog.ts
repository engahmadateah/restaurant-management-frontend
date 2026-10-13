import { apiClient } from "./client";
import type { PaginatedResponse } from "@/types/models";

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  user?: { id: number; name: string; role: string } | null;
  action: string;
  auditable_type: string;
  auditable_type_short: string;
  auditable_id: number;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent?: string | null;
  created_at: string;
}

export type AuditAction = "created" | "updated" | "deleted";


export interface AuditLogFilters {
  actions: AuditAction[];
  models: string[];
  users: { id: number; name: string; role: string }[];
}

export const auditLogApi = {
  filters: () => apiClient.get<AuditLogFilters>("/audit-logs/filters").then((r) => r.data),
  list: (params?: {
    page?: number;
    user_id?: number;
    action?: AuditAction;
    model?: string;
  
    auditable_id?: number;
   
    from?: string;
    to?: string;
  }) => apiClient.get<PaginatedResponse<AuditLogEntry>>("/audit-logs", { params }).then((r) => r.data),
};
