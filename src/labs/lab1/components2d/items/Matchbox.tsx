"use client";

import { motion } from "framer-motion";

interface Props {
  /** Drawer-open animation flag. */
  open: boolean;
}

/**
 * Cartoon cardboard matchbox in cream/yellow with a purple decorative label
 * (reference frame 28). Pressing the box slides its drawer out and exposes
 * a single matchstick that the user can grab.
 */
export function Matchbox({ open }: Props) {
  return (
    <div style={{ position: "relative", width: 110, height: 70 }}>
      <svg width="110" height="70" viewBox="0 0 110 70">
        <defs>
          <linearGradient id="boxOuter" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f6e8b6" />
            <stop offset="100%" stopColor="#d6b56b" />
          </linearGradient>
        </defs>
        {/* Drawer (slides slightly when open) */}
        <motion.g animate={{ x: open ? -22 : 0 }} transition={{ type: "spring", stiffness: 220, damping: 22 }}>
          <rect x="2" y="14" width="100" height="42" rx="3" fill="#fff3c8" stroke="#a78b40" strokeWidth="1" />
          <rect x="6" y="18" width="92" height="6" rx="1" fill="#e8d18e" />
        </motion.g>
        {/* Outer sleeve */}
        <rect x="6" y="10" width="98" height="48" rx="3" fill="url(#boxOuter)" stroke="#a78b40" strokeWidth="1.2" />
        {/* Strike strip on one side */}
        <rect x="6" y="46" width="98" height="10" rx="2" fill="#6b4d28" />
        {/* Striking texture (dots) */}
        {[...Array(14)].map((_, i) => (
          <circle key={i} cx={12 + i * 7} cy="51" r="0.8" fill="#3c2912" />
        ))}
        {/* Label area */}
        <rect x="22" y="20" width="56" height="22" rx="2" fill="#fbeada" stroke="#a78b40" strokeWidth="0.6" />
        <text
          x="50"
          y="36"
          textAnchor="middle"
          fontFamily="serif"
          fontSize="11"
          fontStyle="italic"
          fill="#4b1d6b"
        >
          Gugurt
        </text>
        {/* Decorative microbe-ish icon */}
        <g opacity="0.65" transform="translate(80, 18)">
          <circle cx="6" cy="6" r="4" fill="#4b1d6b" />
          <path d="M2 6 L0 4 M2 6 L0 8 M10 6 L12 4 M10 6 L12 8 M6 2 L6 0 M6 10 L6 12" stroke="#4b1d6b" strokeWidth="1" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
