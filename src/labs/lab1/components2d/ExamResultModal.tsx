"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ExamResult, StepStatus } from "../exam/scoring";

interface Props {
  result: ExamResult;
  onRestart: () => void;
  onViewScope: () => void;
}

function tier(total: number): { key: string; color: string } {
  if (total >= 8.5) return { key: "ui.tierExcellent", color: "#10b981" };
  if (total >= 7) return { key: "ui.tierGood", color: "#3b82f6" };
  if (total >= 5) return { key: "ui.tierOk", color: "#f59e0b" };
  return { key: "ui.tierPoor", color: "#ef4444" };
}

const STEP_MARK: Record<StepStatus, { icon: string; color: string; bg: string; noteKey: string }> = {
  ok: { icon: "✓", color: "#059669", bg: "#ecfdf5", noteKey: "lab1.exam.statusOk" },
  order: { icon: "↔", color: "#d97706", bg: "#fffbeb", noteKey: "lab1.exam.statusOrder" },
  missing: { icon: "⊘", color: "#94a3b8", bg: "#f8fafc", noteKey: "lab1.exam.statusMissing" },
};

function Row({
  icon,
  color,
  bg,
  label,
  note,
  pts,
}: {
  icon: string;
  color: string;
  bg: string;
  label: string;
  note: string;
  pts: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: bg }}>
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold" style={{ color, border: `1.5px solid ${color}` }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-slate-700">{label}</p>
        <p className="text-[11px]" style={{ color }}>{note}</p>
      </div>
      <span className="shrink-0 text-[12px] font-semibold tabular-nums text-slate-500">{pts}</span>
    </div>
  );
}

/** Detailed end-of-exam breakdown — shows exactly where points were lost. */
export function ExamResultModal({ result, onRestart, onViewScope }: Props) {
  const tr = useTranslations();
  const t = tier(result.total);
  const stepsEarned = result.steps.reduce((a, s) => a + s.earned, 0);
  const stepsMax = result.steps.reduce((a, s) => a + s.max, 0);
  const detailsEarned = result.details.reduce((a, d) => a + d.earned, 0);
  const detailsMax = result.details.reduce((a, d) => a + d.max, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="flex max-h-[92vh] w-[min(94vw,560px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header / total */}
        <div className="flex items-center gap-4 px-6 py-5" style={{ background: `linear-gradient(135deg, ${t.color}22, #ffffff)` }}>
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: t.color }}>
            <div className="text-center leading-none">
              <div className="text-2xl font-extrabold">{result.total.toFixed(1)}</div>
              <div className="text-[10px] opacity-90">/ 10</div>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{tr(t.key)}</p>
            <p className="text-[13px] text-slate-500">{tr("lab1.exam.subtitle")}</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 wb-tray">
          {/* Planning */}
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">{tr("lab1.exam.planning")}</h3>
              <span className="text-[12px] font-semibold text-slate-500">{result.planning.earned.toFixed(2)} / {result.planning.max.toFixed(1)}</span>
            </div>
            <Row
              icon={result.planning.correct === result.planning.total ? "✓" : "↔"}
              color={result.planning.correct === result.planning.total ? "#059669" : "#d97706"}
              bg={result.planning.correct === result.planning.total ? "#ecfdf5" : "#fffbeb"}
              label={tr("lab1.exam.planningRow")}
              note={tr("lab1.exam.planningNote", { correct: result.planning.correct, total: result.planning.total })}
              pts={`${result.planning.earned.toFixed(2)}`}
            />
          </section>

          {/* Main steps */}
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">{tr("lab1.exam.mainSteps")}</h3>
              <span className="text-[12px] font-semibold text-slate-500">{stepsEarned.toFixed(1)} / {stepsMax.toFixed(1)}</span>
            </div>
            <div className="space-y-1.5">
              {result.steps.map((s) => {
                const m = STEP_MARK[s.status];
                return <Row key={s.id} icon={m.icon} color={m.color} bg={m.bg} label={tr(s.label)} note={tr(m.noteKey)} pts={`${s.earned.toFixed(1)} / ${s.max.toFixed(1)}`} />;
              })}
            </div>
          </section>

          {/* Details */}
          <section>
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">{tr("lab1.exam.details")}</h3>
              <span className="text-[12px] font-semibold text-slate-500">{detailsEarned.toFixed(1)} / {detailsMax.toFixed(1)}</span>
            </div>
            <div className="space-y-1.5">
              {result.details.map((d) => (
                <Row
                  key={d.id}
                  icon={d.ok ? "✓" : "⚠"}
                  color={d.ok ? "#059669" : "#e11d48"}
                  bg={d.ok ? "#ecfdf5" : "#fef2f2"}
                  label={tr(d.label)}
                  note={d.ok ? tr("lab1.exam.detailDone") : tr("lab1.exam.detailIgnored")}
                  pts={`${d.earned.toFixed(1)} / ${d.max.toFixed(1)}`}
                />
              ))}
            </div>
          </section>

          {/* Penalty / gross actions */}
          {result.penalty > 0 && (
            <section>
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                <p className="text-[13px] font-semibold text-rose-700">{tr("lab1.exam.penalty", { p: result.penalty.toFixed(1) })}</p>
                {result.grossLabels.length > 0 && (
                  <ul className="mt-1 list-inside list-disc text-[11px] text-rose-600">
                    {result.grossLabels.map((g, i) => (
                      <li key={i}>{tr("lab1.exam.grossItem", { g: tr(g) })}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-slate-200 p-3">
          <button
            onClick={onViewScope}
            className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            {tr("lab1.result.title")}
          </button>
          <button
            onClick={onRestart}
            className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-400"
          >
            {tr("ui.restart")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
