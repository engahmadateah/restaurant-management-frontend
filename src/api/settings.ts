import { apiClient } from "./client";

export type SettingsMap = Record<string, string>;

export const settingsApi = {
  get: () => apiClient.get<SettingsMap>("/settings").then((r) => r.data),
  update: (settings: SettingsMap) => apiClient.put<{ message: string }>("/settings", { settings }).then((r) => r.data),
};
