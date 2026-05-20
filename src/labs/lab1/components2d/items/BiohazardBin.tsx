"use client";

import { motion } from "framer-motion";

interface Props {
  /** Brief lid-lift animation triggered by an incoming drop. */
  bumpKey?: number;
}

/**
 * Red biohazard waste bin with white rim and the universal trefoil symbol.
 * Matches reference frame 28-32: bin sits bottom-left of the stage. The
 * `bumpKey` prop animates a quick lid lift when something is discarded.
 */
export function BiohazardBin({ bumpKey = 0 }: Props) {
  return (
    <div style={{ position: "relative", width: 110, height: 130 }}>
      <svg width="110" height="130" viewBox="0 0 110 130">
        <defs>
          <linearGradient id="bagBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d65148" />
            <stop offset="100%" stopColor="#a72e26" />
          </linearGradient>
        </defs>

        {/* Body */}
        <path d="M14 36 L96 36 L92 124 L18 124 Z" fill="url(#bagBody)" stroke="#7d1f18" strokeWidth="1.2" />
        {/* Highlight */}
        <path d="M22 40 L26 116" stroke="#ffffff" strokeWidth="2" opacity="0.35" />
        {/* Bottom white band */}
        <path d="M19 120 L91 120 L92 124 L18 124 Z" fill="#f4f0ec" stroke="#7d1f18" strokeWidth="0.8" />
        {/* Trefoil biohazard */}
        <g transform="translate(55, 78) scale(0.55)">
          <circle cx="0" cy="-24" r="14" fill="none" stroke="#7d1f18" strokeWidth="6" />
          <circle cx="22" cy="14" r="14" fill="none" stroke="#7d1f18" strokeWidth="6" />
          <circle cx="-22" cy="14" r="14" fill="none" stroke="#7d1f18" strokeWidth="6" />
          <circle cx="0" cy="0" r="6" fill="#7d1f18" />
        </g>
      </svg>

      {/* Lid */}
      <motion.div
        key={bumpKey}
        animate={{ y: bumpKey ? [0, -10, 0] : 0, rotate: bumpKey ? [0, -4, 0] : 0 }}
        transition={{ duration: 0.6 }}
        style={{ position: "absolute", left: 8, top: 26, width: 94, height: 16 }}
      >
        <svg width="94" height="16" viewBox="0 0 94 16">
          <ellipse cx="47" cy="8" rx="46" ry="7.5" fill="#f7f1ec" stroke="#7d1f18" strokeWidth="1.2" />
          <ellipse cx="47" cy="8" rx="46" ry="3" fill="#cfc1b3" />
        </svg>
      </motion.div>
    </div>
  );
}
