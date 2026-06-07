"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ExamResult, StepStatus } from "../exam/scoring";

interface Props {
  result: ExamResult;
  onRestart: () => void;
  /** Learn mode: softer framing + a close button. */
  learn?: boolean;
  onClose?: () => void;
}

function tier(pct: number): { key: string; color: string } {
  if (pct >= 85) return { key: "ui.tierExcellent", color: "#10b981" };
  if (pct >= 70) return { key: "ui.tierGood", color: "#3b82f6" };
  if (pct >= 50) return { key: "ui.tierOk", color: "#f59e0b" };
  return { key: "ui.tierPoor", color: "#ef4444" };
}

const MARK: Record<StepStatus, { icon: string; color: string; bg: string }> = {
  full: { icon: "✓", color: "#059669", bg: "#ecfdf5" },
  partial: { icon: "≈", color: "#d97706", bg: "#fffbeb" },
  zero: { icon: "✕", color: "#dc2626", bg: "#fef2f2" },
};

/** End-of-prep breakdown for Lab 5 — six PDF stages, full/partial/zero. */
export function Lab5ResultModal({ result, onRestart, learn, onClose }: Props) {
  const tr = useTranslations();
  const pct = (result.total / result.max) * 100;
  const t = tier(pct);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ y: 20, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 240, damping: 24 }} className="flex max-h-[92vh] w-[min(94vw,560px)] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center gap-4 px-6 py-5" style={{ background: `linear-gradient(135deg, ${t.color}22, #ffffff)` }}>
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl text-white shadow-lg" style={{ background: t.color }}>
            <div className="text-center leading-none">
              <div className="text-2xl font-extrabold">{result.total}</div>
              <div className="text-[10px] opacity-90">/ {result.max}</div>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">{tr(t.key)}</p>
            <p className="text-[13px] text-slate-500">{learn ? tr("lab5.resultLearn") : tr("lab5.resultExam")}</p>
          </div>
        </div>

        <div className="wb-tray flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
          {result.steps.map((s) => {
            const m = MARK[s.status];
            return (
              <div key={s.id} className="rounded-xl px-3 py-2.5" style={{ background: m.bg }}>
                <div className="flex items-center gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-sm font-bold" style={{ color: m.color, border: `1.5px solid ${m.color}` }}>{m.icon}</span>
                  <p className="flex-1 text-[13px] font-medium leading-snug text-slate-700">{tr(s.label)}</p>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums" style={{ color: m.color }}>{s.earned} / {s.full}</span>
                </div>
                {s.notes.length > 0 && (
                  <ul className="mt-1 list-inside list-disc pl-9 text-[11px]" style={{ color: m.color }}>
                    {s.notes.map((n, i) => <li key={i}>{tr(n)}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-3">
          {learn && onClose && (
            <button onClick={onClose} className="flex-1 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-200">{tr("ui.close")}</button>
          )}
          <button onClick={onRestart} className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-400">{tr("ui.restart")}</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
