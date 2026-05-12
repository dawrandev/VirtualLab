"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { LampTopDown } from "../items/LampTopDown";
import { useAutoDone } from "./_useAutoDone";
import { usePhase } from "./_usePhase";

/** Wick close-up — first the wick alone, then a struck match lowers in
 *  and the flame ignites. */
export default function LampIgniteZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1500);
  const phase = usePhase(700);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <LampTopDown lit={phase === "post"} diameter={300} />
      {/* Match approaching from above during the pre-phase */}
      {phase === "pre" && (
        <motion.div
          initial={{ y: -160, rotate: -22, opacity: 0 }}
          animate={{ y: -10, rotate: -22, opacity: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: "50%" }}
        >
          <svg width="120" height="40" viewBox="0 0 120 40">
            <rect x="22" y="14" width="80" height="8" rx="2" fill="#a16207" stroke="#5c3e10" strokeWidth="0.6" />
            <ellipse cx="20" cy="18" rx="7" ry="6" fill="#c83e28" stroke="#7a1f0f" strokeWidth="0.6" />
            <g transform="translate(0,-26)">
              {/* tiny flame */}
              <path d="M20 38 C 12 32 12 22 18 14 C 20 18 24 14 22 8 C 26 16 28 28 20 38 Z" fill="#ff8a30" />
            </g>
          </svg>
        </motion.div>
      )}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        {phase === "pre" ? "Lampani yoqyapmiz" : "Lampa yondi"}
      </div>
    </div>
  );
}
