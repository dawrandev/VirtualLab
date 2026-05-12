"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { LampTopDown } from "../items/LampTopDown";
import { useAutoDone } from "./_useAutoDone";

/** Lamp wick close-up — flame fades in over the wick. */
export default function LampIgniteZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1200);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.div
        initial={{ scale: 0.92, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <LampTopDown lit diameter={300} />
      </motion.div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        Lampa yondi
      </div>
    </div>
  );
}
