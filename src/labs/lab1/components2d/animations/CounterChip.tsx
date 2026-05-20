"use client";

import { AnimatePresence, motion } from "framer-motion";

interface Props {
  /** Current count (e.g., 1). */
  current: number;
  /** Total required (e.g., 3). */
  total: number;
  /** Action description, shown below the count line. */
  label: string;
}

/**
 * Reference seg2_18: white pill attached to the hand cursor that shows
 * `1/3 Провести в 🔥` during multi-pass interactions. Left side: small
 * yellow square with the current pass; slash + total to the right; the
 * action label below in smaller text. Mounts inside `HandCursor`.
 */
export function CounterChip({ current, total, label }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        key={`${current}/${total}`}
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="absolute left-8 top-3 flex flex-col gap-0.5 rounded-lg bg-white/95 shadow-md text-slate-800 pl-1 pr-2.5 py-1 whitespace-nowrap"
      >
        <div className="flex items-center gap-1.5">
          <motion.span
            key={current}
            initial={{ scale: 0.7, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 20 }}
            className="grid place-items-center w-6 h-6 rounded-md bg-amber-300 text-slate-900 text-sm font-bold shadow-sm"
          >
            {current}
          </motion.span>
          <span className="text-slate-500 font-semibold text-sm leading-none">/</span>
          <span className="text-slate-700 font-bold text-sm leading-none">{total}</span>
        </div>
        <div className="text-[11px] font-medium leading-tight text-slate-700">{label}</div>
      </motion.div>
    </AnimatePresence>
  );
}
