"use client";

import { useTranslations } from "next-intl";
import { useLabStore } from "@/stores/labStore";
import type { LabConfig } from "@/engine/types";

interface Props {
  config: LabConfig;
}

export function ScorePanel({ config }: Props) {
  const t = useTranslations();
  const score = useLabStore((s) => s.state.score);

  const maxTotal = config.rubric.reduce((sum, c) => sum + c.maxPoints, 0);

  return (
    <div className="rounded-2xl bg-slate-900/70 backdrop-blur-md ring-1 ring-white/10 shadow-xl p-4 h-full overflow-y-auto">
      <h2 className="text-sm font-semibold tracking-wide text-indigo-100 mb-3">
        {t("lab1.scoreTitle")}
      </h2>

      {/* Overall */}
      <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ring-1 ring-indigo-400/30 p-4 mb-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-indigo-200">{t("lab1.totalScore")}</span>
          <span className="text-3xl font-bold text-white">
            {score.outOfTen.toFixed(1)}
          </span>
        </div>
        <div className="text-xs text-slate-400 text-right">
          ({score.total.toFixed(1)} / {maxTotal.toFixed(1)})
        </div>
      </div>

      {/* Per-criterion */}
      <div className="space-y-2">
        {config.rubric.map((c) => {
          const got = score.byCriterion[c.id] ?? 0;
          const ratio = got / c.maxPoints;
          return (
            <div key={c.id}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300 truncate">
                  {t(`lab1.criterion.${c.id}` as never)}
                </span>
                <span className="text-slate-200 font-mono tabular-nums">
                  {got.toFixed(1)} / {c.maxPoints.toFixed(1)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(100, ratio * 100)}%`,
                    background:
                      ratio >= 1
                        ? "linear-gradient(90deg, #34d399, #10b981)"
                        : ratio >= 0.5
                          ? "linear-gradient(90deg, #fbbf24, #f59e0b)"
                          : "linear-gradient(90deg, #fb7185, #f43f5e)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
