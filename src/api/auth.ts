import { apiClient } from "./client";
import type { LoginResponse, User } from "@/types/auth";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>("/login", { email, password }).then((r) => r.data),

  logout: () => apiClient.post("/logout"),

  me: () => apiClient.get<User>("/me").then((r) => r.data),

  changePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => apiClient.post<{ message: string; user: User }>("/change-password", payload).then((r) => r.data),

  forgotPassword: (email: string) => apiClient.post("/forgot-password", { email }),

  resetPassword: (payload: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => apiClient.post("/reset-password", payload),
};
