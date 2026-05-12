"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { TopDownSlide } from "./_TopDownSlide";
import { useAutoDone } from "./_useAutoDone";

/** Big top-down slide; a blue drop falls from above and splashes onto it. */
export default function NaClDropZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1400);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <TopDownSlide />
      {/* Falling drop */}
      <motion.div
        initial={{ y: -240, opacity: 0, scaleY: 1, scaleX: 1 }}
        animate={{ y: 0, opacity: 1, scaleY: 1.3, scaleX: 0.85 }}
        transition={{ duration: 0.6, ease: [0.55, 0.05, 0.6, 1] }}
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          width: 30,
          height: 30,
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          background: "#88c5d8",
          boxShadow: "inset -3px -3px 5px rgba(0,0,0,0.15), inset 3px 3px 5px rgba(255,255,255,0.45)",
        }}
      />
      {/* Splash ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.85, 0], scale: [0, 1.8, 2.4] }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-sky-300/70"
        style={{ width: 60, height: 24 }}
      />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        NaCl tomchisi qo'yildi
      </div>
    </div>
  );
}
