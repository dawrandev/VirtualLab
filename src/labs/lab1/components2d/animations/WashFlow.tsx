"use client";

import { motion } from "framer-motion";

/**
 * Pale water sheen that scrolls top→bottom across the slide. One-shot per
 * trigger increment.
 */
export function WashFlow({
  trigger,
  width,
  height,
  durationMs = 500,
}: {
  trigger: number;
  width: number;
  height: number;
  durationMs?: number;
}) {
  if (!trigger) return null;
  return (
    <motion.div
      key={trigger}
      initial={{ y: -height, opacity: 0.85 }}
      animate={{ y: height, opacity: 0 }}
      transition={{ duration: durationMs / 1000, ease: "easeIn" }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height: height / 2,
        background: "linear-gradient(180deg, rgba(170,210,230,0) 0%, rgba(170,210,230,0.75) 45%, rgba(170,210,230,0) 100%)",
        borderRadius: 4,
        pointerEvents: "none",
      }}
    />
  );
}
