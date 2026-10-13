import { create } from "zustand";
import type { SettingsMap } from "@/api/settings";

interface SettingsState {
  settings: SettingsMap;
  loaded: boolean;
  setSettings: (settings: SettingsMap) => void;
}


export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: {},
  loaded: false,
  setSettings: (settings) => set({ settings, loaded: true }),
}));


export function getSetting(key: string, fallback: string): string {
  const value = useSettingsStore.getState().settings[key];
  return value !== undefined && value !== null && value !== "" ? value : fallback;
}
