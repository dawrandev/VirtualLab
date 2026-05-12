"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { TopDownSlide } from "./_TopDownSlide";
import { useAutoDone } from "./_useAutoDone";

/** Water sheen scrolls top→bottom across the slide. */
export default function WashZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1000);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <TopDownSlide />
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
          translate: "-50% 0",
          top: "50%",
        }}
      />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        Yuvildi
      </div>
    </div>
  );
}
