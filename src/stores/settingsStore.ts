import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "uz" | "kaa" | "ru";

interface SettingsState {
  locale: Locale;
  muted: boolean;
  volume: number;
  setLocale: (l: Locale) => void;
  setMuted: (m: boolean) => void;
  setVolume: (v: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      locale: "uz",
      muted: false,
      volume: 0.6,
      setLocale: (locale) => set({ locale }),
      setMuted: (muted) => set({ muted }),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
    }),
    {
      name: "vcl_settings_v1",
      version: 1,
    },
  ),
);
