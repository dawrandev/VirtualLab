"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { useLab2DStore } from "@/stores/labStore2d";
import type { StainId } from "@/engine2d/types";
import { TopDownSlide } from "./_TopDownSlide";
import { useAutoDone } from "./_useAutoDone";
import { usePhase } from "./_usePhase";

/** Pre: slide still wet with the just-applied stain (washed=false). Sheen
 *  scrolls down. Post: slide with the stain washed (matches live state). */
export default function WashZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1100);
  const phase = usePhase(750);
  // Find which stain we're washing in this beat (the most recently
  // applied-and-not-yet-washed one in the live state).
  const justWashed = useLab2DStore((s) => mostRecentWashedStain(s.state.slide.stains));
  return (
    <div className="absolute inset-0 grid place-items-center">
      <TopDownSlide
        override={
          phase === "pre" && justWashed
            ? { stainApplied: { id: justWashed, applied: true, washed: false } }
            : undefined
        }
      />
      <motion.div
        className="absolute pointer-events-none"
        initial={{ y: -200, opacity: 0.7 }}
        animate={{ y: 200, opacity: 0 }}
        transition={{ duration: 0.85, ease: "easeIn" }}
        style={{
          width: 520,
          height: 80,
          background:
            "linear-gradient(180deg, rgba(170,210,230,0) 0%, rgba(170,210,230,0.85) 45%, rgba(170,210,230,0) 100%)",
          left: "50%",
          top: "50%",
          translate: "-50% 0",
        }}
      />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        {phase === "pre" ? "Yuvilmoqda" : "Yuvildi"}
      </div>
    </div>
  );
}

/** Heuristic: the most recent stain in priority order that's now washed. */
function mostRecentWashedStain(
  stains: Record<StainId, { applied: boolean; washed: boolean }>,
): StainId | null {
  if (stains.safranin.applied && stains.safranin.washed) return "safranin";
  if (stains.lugol.applied && stains.lugol.washed) return "lugol";
  if (stains.cv.applied && stains.cv.washed) return "cv";
  return null;
}
