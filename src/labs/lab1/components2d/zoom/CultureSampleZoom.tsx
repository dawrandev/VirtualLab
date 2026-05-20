"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CultureDishTopDown } from "../items/CultureDishTopDown";
import { BacterialLoop } from "../items/BacterialLoop";
import { useAutoDone } from "./_useAutoDone";

/** Loop dips into the agar — streak appears after touch. */
export default function CultureSampleZoom({ onDone }: ZoomViewProps) {
  const [sampled, setSampled] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setSampled(true), 900);
    return () => window.clearTimeout(t);
  }, []);
  useAutoDone(onDone, 1600);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <AnimatePresence>
        <motion.div
          key={sampled ? "after" : "before"}
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <CultureDishTopDown sampled={sampled} diameter={440} />
        </motion.div>
      </AnimatePresence>
      <motion.div
        className="absolute"
        initial={{ y: -260, x: -40, rotate: -20, opacity: 0 }}
        animate={{ y: 30, x: -40, rotate: -20, opacity: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ width: 280, top: "50%", left: "50%", translateX: "-50%" }}
      >
        <BacterialLoop heatLevel={0} />
      </motion.div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        Namuna olindi
      </div>
    </div>
  );
}
