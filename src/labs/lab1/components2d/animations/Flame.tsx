"use client";

import { motion } from "framer-motion";

interface Props {
  width?: number;
  height?: number;
  /** 0..1 intensity. 0 = invisible. */
  intensity?: number;
  /** Color preset. */
  preset?: "lamp" | "match" | "fix";
}

/**
 * Cartoon teardrop flame — reference seg2_06/seg2_11/seg2_18. A single
 * tall path with a soft yellow-to-orange gradient, gentle vertical scale
 * flicker (no rotation, no drop-shadow halo, no smoke trail). The lamp
 * variant of this is what sits above the wick; the match variant is
 * smaller and warmer.
 */
export function Flame({ width = 36, height = 70, intensity = 1, preset = "lamp" }: Props) {
  if (intensity <= 0) return null;

  const palette =
    preset === "match"
      ? { tip: "#fff2b0", core: "#ffb030", edge: "#ff7a1a", base: "#cc4a00" }
      : { tip: "#fff6c4", core: "#ffd040", edge: "#ff8a1a", base: "#cf4d00" };

  return (
    <svg width={width} height={height} viewBox="0 0 36 70" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`flame-${preset}`} x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor={palette.base} />
          <stop offset="40%" stopColor={palette.edge} />
          <stop offset="75%" stopColor={palette.core} />
          <stop offset="100%" stopColor={palette.tip} />
        </linearGradient>
      </defs>
      {/* Outer body — teardrop */}
      <motion.path
        d="M18 70 C 6 64 4 44 14 24 C 16 18 20 12 18 0 C 16 12 22 18 22 24 C 32 44 30 64 18 70 Z"
        fill={`url(#flame-${preset})`}
        animate={{
          scaleY: [1, 1.05, 0.97, 1.03, 1],
          scaleX: [1, 0.97, 1.03, 0.98, 1],
        }}
        style={{ transformOrigin: "18px 70px" }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        opacity={intensity}
      />
      {/* Inner glow — small bright sliver */}
      <motion.ellipse
        cx="18"
        cy="42"
        rx="3.5"
        ry="14"
        fill={palette.tip}
        opacity={0.85 * intensity}
        animate={{ scaleY: [1, 1.08, 0.95, 1] }}
        style={{ transformOrigin: "18px 56px" }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
