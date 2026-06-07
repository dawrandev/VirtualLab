"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useSettingsStore, type Locale } from "@/stores/settingsStore";

const LANGS: { code: Locale; short: string }[] = [
  { code: "uz", short: "UZ" },
  { code: "kaa", short: "QQ" },
  { code: "ru", short: "RU" },
  { code: "en", short: "EN" },
];

/**
 * Compact globe language switcher used on the home page and inside every lab
 * header. Reads/writes the persisted locale from the settings store, so the
 * whole UI re-translates instantly (no reload). Light, neutral styling that
 * sits well on both the home backdrop and the white lab headers.
 */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const tl = useTranslations("lang");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  const current = LANGS.find((l) => l.code === locale) ?? LANGS[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:bg-white"
        aria-label="Language"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
        </svg>
        <span className="tabular-nums">{current.short}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-[70] mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          {LANGS.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-slate-50"
                style={{ background: active ? "#eff6ff" : undefined }}
              >
                <span className="flex items-center gap-2.5">
                  <span className="grid h-6 w-7 shrink-0 place-items-center rounded bg-slate-100 text-[10px] font-bold text-slate-500">{l.short}</span>
                  <span className="text-sm font-medium text-slate-700">{tl(l.code)}</span>
                </span>
                {active && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.6">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
