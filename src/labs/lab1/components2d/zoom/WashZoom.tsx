"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { TopDownSlide } from "./_TopDownSlide";
import { useAutoDone } from "./_useAutoDone";
import { usePhase } from "./_usePhase";

/** Pre: slide still flooded with methylene blue (washed=false). Sheen scrolls
 *  down. Post: slide with the stain washed (matches live state). */
export default function WashZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1100);
  const phase = usePhase(750);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <TopDownSlide override={phase === "pre" ? { mbApplied: true, mbWashed: false } : undefined} />
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
