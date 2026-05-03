"use client";

import { useSettingsStore, type Locale } from "@/stores/settingsStore";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "uz", label: "UZ" },
  { code: "kaa", label: "QQ" },
  { code: "ru", label: "RU" },
];

export function LanguageSwitcher() {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  return (
    <div className="flex items-center gap-0.5 rounded-md bg-slate-800/80 p-0.5">
      {LOCALES.map((loc) => (
        <button
          key={loc.code}
          onClick={() => setLocale(loc.code)}
          className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
            locale === loc.code
              ? "bg-indigo-500 text-white shadow-sm"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {loc.label}
        </button>
      ))}
    </div>
  );
}
