"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { motion } from "framer-motion";
import { LampTopDown } from "../items/LampTopDown";
import { BacterialLoop } from "../items/BacterialLoop";
import { useAutoDone } from "./_useAutoDone";

/** Loop tip sterilization — cool grey loop enters the flame, heats up,
 *  exits glowing red. The lamp itself is already lit at this point. */
export default function FlamePassZoom({ onDone }: ZoomViewProps) {
  useAutoDone(onDone, 1400);
  return (
    <div className="absolute inset-0 grid place-items-center">
      <LampTopDown lit diameter={280} />
      <motion.div
        className="absolute"
        style={{ width: 320, top: "30%", left: "50%", translateX: "-50%" }}
        initial={{ x: "-65%" }}
        animate={{ x: "65%" }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      >
        <motion.div
          initial={{ filter: "hue-rotate(0deg) brightness(1)" }}
          animate={{ filter: "hue-rotate(0deg) brightness(1.4)" }}
          transition={{ duration: 1.1 }}
        >
          <HeatLoop />
        </motion.div>
      </motion.div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
        Halqa olovdan o'tdi
      </div>
    </div>
  );
}

/** Loop with stroke that interpolates grey → red as it crosses the flame. */
function HeatLoop() {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{}}
      style={{ display: "inline-block" }}
    >
      <motion.div
        initial={false}
        animate={{ filter: ["drop-shadow(0 0 0 transparent)", "drop-shadow(0 0 14px rgba(255,90,30,0.85))", "drop-shadow(0 0 0 transparent)"] }}
        transition={{ duration: 1.1, times: [0, 0.5, 1] }}
      >
        <BacterialLoop heatLevel={0.85} />
      </motion.div>
    </motion.div>
  );
}
