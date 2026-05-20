"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { TopDownSlide } from "./_TopDownSlide";
import { BacterialLoop } from "../items/BacterialLoop";
import { useAutoDone } from "./_useAutoDone";
import { usePhase } from "./_usePhase";

/** Pre: slide with NaCl, no smear yet. Loop swirls. Post: smear appears. */
export default function SmearZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 2000);
  const phase = usePhase(1700);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <TopDownSlide override={phase === "pre" ? { smeared: false } : undefined} />
      {/* Loop swirls across the slide. Visible mostly during the pre-phase. */}
      <motion.div
        className="absolute"
        style={{ width: 240, left: "50%", top: "50%", translateX: "-50%", translateY: "-50%" }}
        animate={{
          x: [-30, 30, -25, 25, -10, 10, 0],
          y: [10, -10, 15, -8, 4, -3, 0],
          rotate: [-8, 8, -6, 6, -3, 3, 0],
          opacity: phase === "post" ? [1, 0] : [1, 1],
        }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      >
        <BacterialLoop heatLevel={0} />
      </motion.div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        {phase === "pre" ? "Surtma qilinmoqda" : "Surtma qilindi"}
      </div>
    </div>
  );
}
