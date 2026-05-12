"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { LampTopDown } from "../items/LampTopDown";
import { BacterialLoop } from "../items/BacterialLoop";
import { useAutoDone } from "./_useAutoDone";

/** Loop tip sterilization — loop sweeps left→right across the flame. */
export default function FlamePassZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1400);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <LampTopDown lit diameter={280} />
      <motion.div
        className="absolute"
        initial={{ x: "-65%", y: "-10%" }}
        animate={{ x: "65%", y: "-10%" }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
        style={{ width: 320, top: "30%", left: "50%", translateX: "-50%" }}
      >
        <BacterialLoop heatLevel={1} />
      </motion.div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        Halqa olovdan o'tdi
      </div>
    </div>
  );
}
