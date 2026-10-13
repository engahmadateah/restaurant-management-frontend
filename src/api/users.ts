import { apiClient } from "./client";
import type { SalaryType, StaffUser } from "@/types/models";
import type { Permission, UserRole } from "@/types/auth";

export interface UserListParams {
  role?: UserRole;
  is_active?: boolean;
  search?: string;
  per_page?: number | "all";
}

export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone?: string | null;
  is_active: boolean;

  salary_type: SalaryType;
  hourly_rate: number | null;
  monthly_salary: number | null;
  weekly_overtime_threshold_hours: number;
  overtime_multiplier: number;
}


export interface PermissionsCatalog {
  all: Permission[];
  defaults: Record<UserRole, Permission[] | ["*"]>;
}


export interface UserPermissions {
  user_id: number;
  role?: UserRole;
  role_defaults?: Permission[] | ["*"];
  extra_permissions: Permission[];
  revoked_permissions: Permission[];
  effective_permissions: Permission[] | ["*"];
}

export interface UpdateUserPermissionsPayload {
  extra_permissions?: Permission[];
  revoked_permissions?: Permission[];
}

export const usersApi = {
  list: (params?: UserListParams) =>
    apiClient.get<StaffUser[]>("/users", { params: { per_page: "all", ...params } }).then((r) => r.data),
  get: (id: number) => apiClient.get<StaffUser>(`/users/${id}`).then((r) => r.data),
  create: (payload: UserPayload) => apiClient.post<StaffUser>("/users", payload).then((r) => r.data),
  update: (id: number, payload: Partial<UserPayload>) =>
    apiClient.put<StaffUser>(`/users/${id}`, payload).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/users/${id}`),
  resetPassword: (id: number, password: string) =>
    apiClient.post<{ message: string }>(`/users/${id}/reset-password`, { password }),

 
  availablePermissions: () => apiClient.get<PermissionsCatalog>("/permissions").then((r) => r.data),
  getPermissions: (id: number) => apiClient.get<UserPermissions>(`/users/${id}/permissions`).then((r) => r.data),
  updatePermissions: (id: number, payload: UpdateUserPermissionsPayload) =>
    apiClient.put<UserPermissions>(`/users/${id}/permissions`, payload).then((r) => r.data),
};