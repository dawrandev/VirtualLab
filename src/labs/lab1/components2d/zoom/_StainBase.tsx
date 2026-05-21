"use client";

import { motion } from "framer-motion";
import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { TopDownSlide } from "./_TopDownSlide";
import { useAutoDone } from "./_useAutoDone";
import { usePhase } from "./_usePhase";

interface Props extends ZoomViewProps {
  color: string;
  label: string;
  /** Cutscene duration in milliseconds. */
  ms: number;
}

/**
 * Single-stain cutscene (methylene blue) with explicit BEFORE/AFTER phasing.
 *   pre  (0 … 65% ms): slide rendered WITHOUT the stain; drops fall, ring expands.
 *   post (65% … 100%): slide rendered WITH the stain (matches live state).
 */
export function StainBase({ onDone, color, label, ms }: Props) {
  useAutoDone(onDone, ms);
  const phase = usePhase(Math.round(ms * 0.65));
  return (
    <div className="absolute inset-0 grid place-items-center">
      <TopDownSlide override={phase === "pre" ? { mbApplied: false } : undefined} />
      {/* Falling droplets — appear in pre-phase */}
      {phase === "pre" &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 -translate-x-1/2"
            initial={{ y: -230, x: -40 + i * 40, opacity: 0, scale: 1 }}
            animate={{ y: 0, x: -40 + i * 40, opacity: 1, scale: 0.6 }}
            transition={{ duration: 0.5, delay: i * 0.13, ease: [0.55, 0.05, 0.6, 1] }}
            style={{
              width: 24,
              height: 24,
              borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
              background: color,
              boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.35)",
            }}
          />
        ))}
      {/* Flood ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.4, 3.2], opacity: [0, 0.5, 0] }}
        transition={{ duration: ms / 1000 - 0.2, delay: 0.4 }}
        style={{ width: 120, height: 40, background: color, filter: "blur(8px)" }}
      />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        {label}
      </div>
    </div>
  );
}
