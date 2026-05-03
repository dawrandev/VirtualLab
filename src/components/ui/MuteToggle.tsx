"use client";

import { useEffect } from "react";
import { audioEngine } from "@/engine/audio/AudioEngine";
import { useSettingsStore } from "@/stores/settingsStore";

export function MuteToggle() {
  const muted = useSettingsStore((s) => s.muted);
  const setMuted = useSettingsStore((s) => s.setMuted);

  useEffect(() => {
    audioEngine.setMuted(muted);
  }, [muted]);

  return (
    <button
      onClick={() => setMuted(!muted)}
      className="rounded-md bg-slate-800/80 p-1.5 text-slate-200 hover:bg-slate-700/80 transition"
      aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
    >
      {muted ? (
        <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 11h2l3-3v8l-3-3H5v-2zm9 1l3-3m0 6l-3-3"
          />
        </svg>
      ) : (
        <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 11h2l3-3v8l-3-3H5v-2zm9-2a3 3 0 010 4m2-7a6 6 0 010 10"
          />
        </svg>
      )}
    </button>
  );
}
