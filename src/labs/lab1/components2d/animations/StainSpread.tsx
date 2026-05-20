"use client";

import { motion } from "framer-motion";

/**
 * Soft circular reveal of a colored wash across a small rect (slide area).
 * Used immediately after a dye drop to flood-fill the slide before the
 * timer kicks in. Placed absolutely over the slide.
 */
export function StainSpread({
  trigger,
  width,
  height,
  color,
  durationMs = 800,
}: {
  trigger: number;
  width: number;
  height: number;
  color: string;
  durationMs?: number;
}) {
  if (!trigger) return null;
  return (
    <motion.div
      key={trigger}
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(140% at 50% 50%)" }}
      transition={{ duration: durationMs / 1000, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        background: color,
        opacity: 0.55,
        borderRadius: 4,
        pointerEvents: "none",
      }}
    />
  );
}
