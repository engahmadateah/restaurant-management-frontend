import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

export const apiClient = axios.create({

  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
     
      useAuthStore.getState().clear();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
  
    if (error.response?.status === 403 && error.response?.data?.code === "password_change_required") {
      const { user, updateUser } = useAuthStore.getState();
      if (user && !user.must_change_password) {
        updateUser({ ...user, must_change_password: true });
      }
    }
    return Promise.reject(error);
  }
);


export interface ApiValidationError {
  message: string;
  errors?: Record<string, string[]>;
}


export async function rethrowBlobError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text());
    } catch {

    }
  }
  throw error;
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiValidationError>(error)) {
    return error.response?.data?.message ?? "حدث خطأ غير متوقع، حاول مرة ثانية";
  }
  return "حدث خطأ غير متوقع، حاول مرة ثانية";
}
