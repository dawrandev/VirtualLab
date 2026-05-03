"use client";

import { useTranslations } from "next-intl";

interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const t = useTranslations("lab1");
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-indigo-200">{t("progress")}:</span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-6 rounded-full transition-all duration-300 ${
              i < current
                ? "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-400/40"
                : i === current
                  ? "bg-amber-400 animate-pulse"
                  : "bg-slate-700"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-white">
        {Math.min(current, total)}/{total}
      </span>
    </div>
  );
}
