"use client";

import { motion } from "framer-motion";

interface Props {
  width?: number;
  height?: number;
  /** 0..1 intensity. 0 = invisible, 1 = full lamp. 0.4 = match tip. */
  intensity?: number;
  /** Color preset. Match tip = warmer, lamp = balanced. */
  preset?: "lamp" | "match" | "fix";
}

/**
 * Cartoon teardrop flame (3 concentric layers) with subtle flicker.
 * Inspired by reference frames 28, 32 — slight elongation, asymmetric tip,
 * darker base. Layers use additive-like blending via `mix-blend-mode: screen`.
 */
export function Flame({ width = 64, height = 110, intensity = 1, preset = "lamp" }: Props) {
  if (intensity <= 0) return null;

  const palette =
    preset === "match"
      ? { outer: "#ff6a1a", mid: "#ffb030", core: "#fff2b0" }
      : preset === "fix"
      ? { outer: "#ff8a3a", mid: "#ffd060", core: "#fff8d0" }
      : { outer: "#ff7a1a", mid: "#ffcc33", core: "#fff6b8" };

  const baseScale = 0.4 + 0.6 * intensity;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 110"
      style={{ overflow: "visible", filter: "drop-shadow(0 0 12px rgba(255,150,50,0.65))" }}
    >
      <defs>
        <radialGradient id="flame-outer" cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor={palette.outer} stopOpacity="0.95" />
          <stop offset="100%" stopColor={palette.outer} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="flame-mid" cx="50%" cy="75%" r="55%">
          <stop offset="0%" stopColor={palette.mid} stopOpacity="1" />
          <stop offset="100%" stopColor={palette.mid} stopOpacity="0" />
        </radialGradient>
      </defs>

      <motion.path
        d="M32 100 C12 95 6 65 22 35 C28 22 34 12 32 0 C30 12 38 22 42 35 C58 65 52 95 32 100 Z"
        fill="url(#flame-outer)"
        animate={{
          scale: [baseScale, baseScale * 1.06, baseScale * 0.97, baseScale * 1.04, baseScale],
          rotate: [-1.5, 1, -0.6, 1.2, -1.5],
        }}
        style={{ transformOrigin: "32px 100px" }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M32 98 C19 92 18 70 28 45 C30 38 34 30 32 18 C30 30 36 38 38 45 C48 70 47 92 32 98 Z"
        fill="url(#flame-mid)"
        animate={{
          scale: [baseScale * 0.95, baseScale * 1.05, baseScale * 0.95],
          rotate: [1, -1.5, 0.6, -1, 1],
        }}
        style={{ transformOrigin: "32px 98px" }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M32 95 C26 90 28 75 30 60 C31 52 33 50 32 38 C31 50 33 52 34 60 C36 75 38 90 32 95 Z"
        fill={palette.core}
        opacity={0.85}
        animate={{
          scale: [baseScale * 0.9, baseScale * 1.0, baseScale * 0.9],
        }}
        style={{ transformOrigin: "32px 95px" }}
        transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
