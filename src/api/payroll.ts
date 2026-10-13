import { apiClient, rethrowBlobError } from "./client";
import type { PaginatedResponse, Payroll, PayrollStatus } from "@/types/models";

export interface PayrollListParams {
  user_id?: number;
  status?: PayrollStatus;
  per_page?: number | "all";
  page?: number;
}

export interface PayrollGeneratePayload {
  period_start: string;
  period_end: string;
  user_id?: number;
}

export interface PayrollConflict {
  user_id: number;
  user: string;
  payroll_id: number;
  period_start: string;
  period_end: string;
  status: PayrollStatus;
}

export interface PayrollWarning {
  user_id: number;
  user: string;
  open_shifts: number;
  auto_closed_shifts: number;
}

export interface PayrollGenerateResponse {
  generated: Payroll[];

  skipped: string[];
 
  conflicts: PayrollConflict[];

  warnings: PayrollWarning[];
}

export interface PayrollUpdatePayload {
  deductions?: number;
  notes?: string;
}

export const payrollApi = {
  list: (params?: PayrollListParams) =>
    apiClient.get<PaginatedResponse<Payroll>>("/payroll", { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Payroll>(`/payroll/${id}`).then((r) => r.data),
  generate: (payload: PayrollGeneratePayload) =>
    apiClient.post<PayrollGenerateResponse>("/payroll/generate", payload).then((r) => r.data),
  update: (id: number, payload: PayrollUpdatePayload) =>
    apiClient.put<Payroll>(`/payroll/${id}`, payload).then((r) => r.data),
  approve: (id: number) => apiClient.post<Payroll>(`/payroll/${id}/approve`).then((r) => r.data),
  markPaid: (id: number) => apiClient.post<Payroll>(`/payroll/${id}/mark-paid`).then((r) => r.data),
  remove: (id: number) => apiClient.delete(`/payroll/${id}`),

  payslip: (id: number) =>
    apiClient.get(`/payroll/${id}/payslip`, { responseType: "blob" }).then((r) => r.data as Blob).catch(rethrowBlobError),

  exportFile: (params: { format: "xlsx" | "csv"; status?: PayrollStatus; from?: string; to?: string; user_id?: number }) =>
    apiClient.get("/payroll/export", { params, responseType: "blob" }).then((r) => r.data as Blob).catch(rethrowBlobError),
};
