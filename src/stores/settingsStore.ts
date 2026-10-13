import { create } from "zustand";
import type { SettingsMap } from "@/api/settings";

interface SettingsState {
  settings: SettingsMap;
  loaded: boolean;
  setSettings: (settings: SettingsMap) => void;
}

// مخزن مركزي للإعدادات العامة (اسم المطعم، العنوان، رمز العملة...).
// بيتحمّل مرة وحدة بعد تسجيل الدخول (شوف App.tsx) وبيصير أي مكون
// بالتطبيق فيه يقرأ منه مباشرة بدل ما يكون عنده قيم ثابتة بالكود.
export const useSettingsStore = create<SettingsState>()((set) => ({
  settings: {},
  loaded: false,
  setSettings: (settings) => set({ settings, loaded: true }),
}));

// دالة مساعدة لقراءة إعداد واحد بقيمة افتراضية احتياطية،
// تُستخدم برا الكومبوننتات (مثلاً بملفات lib/ العادية) حيث ما فينا نستخدم hook
export function getSetting(key: string, fallback: string): string {
  const value = useSettingsStore.getState().settings[key];
  return value !== undefined && value !== null && value !== "" ? value : fallback;
}
