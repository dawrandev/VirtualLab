"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { Flame } from "../animations/Flame";
import { TopDownSlide } from "./_TopDownSlide";
import { useAutoDone } from "./_useAutoDone";

/** Slide passes left→right over the flame (heat fixation). */
export default function FlameFixZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1200);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="absolute -translate-x-1/2" style={{ left: "50%", top: "62%" }}>
        <Flame width={80} height={140} intensity={1} preset="fix" />
      </div>
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: "50%", top: "50%" }}
        initial={{ x: -260 }}
        animate={{ x: 260 }}
        transition={{ duration: 1.0, ease: "easeInOut" }}
      >
        <TopDownSlide />
        {/* Warm overlay during flame pass */}
        <motion.div
          className="absolute inset-0 rounded-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0] }}
          transition={{ duration: 1.0 }}
          style={{ background: "rgba(255,140,40,0.4)", mixBlendMode: "screen" }}
        />
      </motion.div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        Fiksatsiya
      </div>
    </div>
  );
}
