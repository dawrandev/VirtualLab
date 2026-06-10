"use client";

import { motion } from "framer-motion";

interface Props {
  /** Colour the run-off slightly toward the dye being rinsed away (optional). */
  tint?: string;
  width?: number;
  height?: number;
}

const WATER = "rgba(150,205,235,0.9)";

/**
 * Realistic water-rinse effect for the wash-bottle steps: a stream pours down
 * onto the slide, droplets fall through it, the water splashes at the surface
 * and then runs off the edges downward into the tray, with a wet shimmer left
 * on the glass. One-shot — mount it (keyed) for the duration of the wash. The
 * slide surface is taken to be the vertical centre of the box.
 */
export function WaterRinse({ tint, width = 170, height = 210 }: Props) {
  const runoff = tint ?? "rgba(150,200,228,0.85)";
  return (
    <div className="pointer-events-none absolute z-30" style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%)", width, height, overflow: "visible" }}>
      {/* Pouring stream — grows down to the slide, holds, then tapers off */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: [0, 96, 96, 70], opacity: [0, 0.95, 0.9, 0] }}
        transition={{ duration: 1.4, times: [0, 0.18, 0.78, 1], ease: "easeOut" }}
        style={{
          position: "absolute",
          left: "50%",
          top: 4,
          marginLeft: -6,
          width: 12,
          borderRadius: 8,
          background: "linear-gradient(180deg, rgba(195,228,246,0.35), rgba(150,205,235,0.92))",
          boxShadow: "0 0 7px rgba(150,205,235,0.65)",
        }}
      />

      {/* Droplets racing down the stream */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`d${i}`}
          initial={{ top: 2, opacity: 0 }}
          animate={{ top: [2, 96], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.55, delay: 0.16 + i * 0.16, ease: "easeIn" }}
          style={{ position: "absolute", left: "50%", marginLeft: -3.5, width: 7, height: 10, borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", background: "rgba(178,220,244,0.96)" }}
        />
      ))}

      {/* Splash at the slide surface (box centre) */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <motion.div
          key={`s${i}`}
          initial={{ x: 0, y: 0, opacity: 0 }}
          animate={{ x: i * 15, y: [0, -13 + Math.abs(i) * 3, 6], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.6, delay: 0.32 + Math.abs(i) * 0.03, ease: "easeOut" }}
          style={{ position: "absolute", left: "50%", top: "50%", marginLeft: -2.5, width: 5, height: 5, borderRadius: "50%", background: "rgba(178,220,244,0.95)" }}
        />
      ))}

      {/* Run-off — water sheets off the slide edges, down into the tray */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <motion.div
          key={`r${i}`}
          initial={{ top: "47%", opacity: 0 }}
          animate={{ top: ["47%", "102%"], opacity: [0, 0.85, 0.85, 0] }}
          transition={{ duration: 0.95, delay: 0.38 + i * 0.05, ease: "easeIn" }}
          style={{ position: "absolute", left: `${24 + i * 8.5}%`, width: 4, height: 15, borderRadius: 3, background: runoff }}
        />
      ))}

      {/* Wet shimmer left on the glass */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.55, 0.2] }}
        transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
        style={{ position: "absolute", left: "20%", right: "20%", top: "45%", height: 18, borderRadius: 7, background: `linear-gradient(90deg, transparent, ${WATER}, rgba(255,255,255,0.7), ${WATER}, transparent)`, filter: "blur(0.5px)" }}
      />
    </div>
  );
}
