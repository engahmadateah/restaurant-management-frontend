import { apiClient } from "./client";
import type { UserRole } from "@/types/auth";


export interface StaffMember {
  id: number;
  name: string;
  role: UserRole;
  phone: string | null;
  is_active: boolean;
}

export const staffDirectoryApi = {
  list: (params?: { role?: UserRole; is_active?: boolean }) =>
    apiClient.get<StaffMember[]>("/staff-directory", { params }).then((r) => r.data),
};
