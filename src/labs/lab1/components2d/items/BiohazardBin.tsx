"use client";

import { motion } from "framer-motion";

interface Props {
  /** Brief lid-lift animation triggered by an incoming drop. */
  bumpKey?: number;
}

/**
 * Red biohazard waste bin — a round, tapered medical bin with a domed white
 * flip-lid and the trefoil symbol. Semi-3D: a cylinder-shaded red body with a
 * left highlight and right shadow, a recessed dark opening, and a separate
 * domed lid that lifts when waste is dropped in.
 */
export function BiohazardBin({ bumpKey = 0 }: Props) {
  return (
    <div style={{ position: "relative", width: 120, height: 150 }}>
      <svg width="120" height="150" viewBox="0 0 120 150">
        <defs>
          <linearGradient id="binBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e8786b" />
            <stop offset="32%" stopColor="#d24d3f" />
            <stop offset="70%" stopColor="#b23628" />
            <stop offset="100%" stopColor="#8c2317" />
          </linearGradient>
          <linearGradient id="binRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c0402f" />
            <stop offset="50%" stopColor="#9a2c1e" />
            <stop offset="100%" stopColor="#741d12" />
          </linearGradient>
          <radialGradient id="binMouth" cx="45%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#5e1810" />
            <stop offset="100%" stopColor="#360c07" />
          </radialGradient>
          <linearGradient id="binLid" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fdfdfc" />
            <stop offset="50%" stopColor="#ece7e0" />
            <stop offset="100%" stopColor="#cbc4ba" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="60" cy="140" rx="40" ry="7" fill="#000" opacity="0.18" />

        {/* Body (tapered cylinder) */}
        <path d="M18 56 L26 132 A34 9 0 0 0 94 132 L102 56 Z" fill="url(#binBody)" stroke="#7d1f18" strokeWidth="0.9" />
        {/* Left highlight + right shade for roundness */}
        <path d="M31 62 Q24 96 33 126" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.28" strokeLinecap="round" />
        <path d="M91 62 Q98 96 87 126" fill="none" stroke="#5e150f" strokeWidth="5" opacity="0.3" strokeLinecap="round" />

        {/* Trefoil biohazard (white on red) */}
        <g transform="translate(60, 96) scale(0.5)" fill="none" stroke="#f4ece9" strokeWidth="6" opacity="0.9">
          <circle cx="0" cy="-24" r="13" />
          <circle cx="21" cy="13" r="13" />
          <circle cx="-21" cy="13" r="13" />
        </g>
        <circle cx="60" cy="96" r="3.4" fill="#f4ece9" opacity="0.9" />

        {/* Top rim + recessed mouth */}
        <ellipse cx="60" cy="56" rx="42" ry="11.5" fill="url(#binRim)" stroke="#7d1f18" strokeWidth="0.9" />
        <ellipse cx="60" cy="55" rx="35" ry="8.6" fill="url(#binMouth)" />
      </svg>

      {/* Domed flip-lid (lifts on discard) */}
      <motion.div
        key={bumpKey}
        animate={{ y: bumpKey ? [0, -13, 0] : 0, rotate: bumpKey ? [0, -5, 0] : 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: "absolute", left: 14, top: 26, width: 92, height: 34, transformOrigin: "85% 90%" }}
      >
        <svg width="92" height="34" viewBox="0 0 92 34">
          {/* lid disc */}
          <ellipse cx="46" cy="24" rx="42" ry="9.5" fill="url(#binLid)" stroke="#b0a89e" strokeWidth="0.9" />
          {/* dome */}
          <path d="M8 23 Q46 -2 84 23 Q84 30 46 33 Q8 30 8 23 Z" fill="url(#binLid)" stroke="#b8b0a6" strokeWidth="0.8" />
          {/* dome highlight */}
          <ellipse cx="38" cy="16" rx="22" ry="6" fill="#ffffff" opacity="0.55" />
          {/* push-flap seam */}
          <path d="M30 18 Q46 11 62 18" fill="none" stroke="#b0a89e" strokeWidth="0.8" opacity="0.7" />
        </svg>
      </motion.div>
    </div>
  );
}
