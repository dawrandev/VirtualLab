"use client";

import { AnimatePresence, motion } from "framer-motion";

interface Props {
  /** Trigger token — change to spawn a new drop. */
  trigger: number;
  /** Drop diameter. */
  size?: number;
  /** Color (NaCl pale blue, stain colors, etc). */
  color?: string;
  /** Vertical distance (px) from start to splash point. */
  fallHeight?: number;
}

/**
 * One-shot falling droplet + splash ring. Mount somewhere and bump `trigger`
 * to play. Designed for placement at the dropper-tip and slide-center pair.
 */
export function Drop({ trigger, size = 14, color = "#88c5d8", fallHeight = 90 }: Props) {
  if (!trigger) return null;
  return (
    <AnimatePresence>
      <motion.div
        key={trigger}
        initial={{ y: 0, opacity: 1, scaleY: 1, scaleX: 1 }}
        animate={{ y: fallHeight, opacity: 1, scaleY: 1.3, scaleX: 0.85 }}
        transition={{ duration: 0.45, ease: [0.5, 0.05, 0.6, 1] }}
        style={{
          position: "absolute",
          left: -size / 2,
          top: -size,
          width: size,
          height: size,
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          background: color,
          boxShadow: `inset -2px -2px 4px rgba(0,0,0,0.15), inset 2px 2px 4px rgba(255,255,255,0.45)`,
        }}
      >
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.6, 1.8], opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.35, delay: 0.43 }}
          style={{
            position: "absolute",
            left: -size / 2,
            top: fallHeight - size / 2,
            width: size * 2,
            height: size / 2,
            borderRadius: "50%",
            border: `2px solid ${color}`,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
