"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useLab2DStore } from "@/stores/labStore2d";
import { useNextActionHint } from "./useNextActionHint";

/**
 * Centered top-of-stage chip. Above the stage title, a persistent
 * "next action" instruction guides the user step-by-step. Below the title,
 * a confirmation card on success or a red retry chip on failure (with the
 * specific missing-step reason).
 */
export function StageBadge() {
  const t = useTranslations();
  const config = useLab2DStore((s) => s.config);
  const currentStageId = useLab2DStore((s) => s.state.currentStageId);
  const stage = useLab2DStore((s) => s.state.stages[s.state.currentStageId]);
  const advanceStage = useLab2DStore((s) => s.advanceStage);
  const checkStage = useLab2DStore((s) => s.checkStage);
  const state = useLab2DStore((s) => s.state);
  const hint = useNextActionHint();

  if (!config || !stage) return null;
  const idx = config.stages.findIndex((s) => s.id === currentStageId);
  const stg = config.stages[idx];
  if (!stg) return null;

  // Compute the precise reason when the stage was failed by the user.
  const failureReason = stage.status === "failed" ? stg.check(state).reasonKey : null;

  return (
    <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-14 z-30 flex flex-col items-center gap-2">
      <motion.div
        layout
        className="pointer-events-auto rounded-2xl bg-white/90 shadow-md px-4 py-1.5 flex items-center gap-2"
      >
        <span className="grid place-items-center w-6 h-6 rounded-md bg-violet-100 text-violet-700 text-xs font-bold">
          {idx + 1}
        </span>
        <span className="text-sm font-semibold text-slate-800">
          {safeT(t, stg.titleKey)}
        </span>
      </motion.div>

      {/* Persistent next-action banner */}
      <AnimatePresence mode="wait">
        {hint && stage.status !== "checked" && (
          <motion.div
            key={hint}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto rounded-xl bg-slate-900/85 text-white text-xs font-medium px-3 py-1.5 shadow-md flex items-center gap-2 max-w-[480px] text-center"
          >
            <span className="text-amber-300">➜</span>
            <span>{hint}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage.status === "checked" && (
          <motion.button
            key="ok"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={advanceStage}
            className="pointer-events-auto rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold px-4 py-2 shadow-md"
          >
            {safeT(t, "lab2d.next")} →
          </motion.button>
        )}
        {stage.status === "failed" && (
          <motion.div
            key="fail"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto flex flex-col items-center gap-2"
          >
            {failureReason && (
              <div className="rounded-xl bg-rose-100 text-rose-800 text-xs font-semibold px-3 py-1.5 shadow-sm">
                {safeT(t, failureReason)}
              </div>
            )}
            <button
              onClick={checkStage}
              className="rounded-2xl bg-rose-500 hover:bg-rose-400 text-white text-sm font-semibold px-4 py-2 shadow-md"
            >
              {safeT(t, "lab2d.retryCheck")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function safeT(t: ReturnType<typeof useTranslations>, key: string): string {
  try {
    return t(key);
  } catch {
    return key;
  }
}
