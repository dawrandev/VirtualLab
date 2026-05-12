"use client";

import { motion } from "framer-motion";
import { Flame } from "../animations/Flame";
import { Smoke } from "../animations/Smoke";

interface Props {
  uncapped: boolean;
  lit: boolean;
}

/**
 * Bulbous spirit lamp with detachable silver cap. Matches reference frame
 * 22-28: light-tinted glass bulb body, golden lamp oil pool, brown wick,
 * silver cylindrical cap with rounded dome. When `uncapped`, the cap
 * animates aside; when `lit`, an animated flame rises from the wick plus
 * a continuous wisp of smoke above.
 */
export function SpiritLamp({ uncapped, lit }: Props) {
  return (
    <div style={{ position: "relative", width: 160, height: 200 }}>
      {/* Smoke trail */}
      <div style={{ position: "absolute", left: 80, top: -10 }}>
        <Smoke active={lit} color="#cfcfcf" size={12} count={5} height={120} width={36} />
      </div>

      {/* Flame */}
      <div
        style={{
          position: "absolute",
          left: 80 - 28,
          top: 6,
          width: 56,
          height: 90,
          pointerEvents: "none",
        }}
      >
        <Flame width={56} height={90} intensity={lit ? 1 : 0} preset="lamp" />
      </div>

      {/* Glass body (large bulb) + collar + neck */}
      <svg width="160" height="200" viewBox="0 0 160 200" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id="lampGlass" cx="35%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#dbeaef" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9dbfca" stopOpacity="0.85" />
          </radialGradient>
          <linearGradient id="oilPool" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e9d27a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#b89a2f" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="silverCap" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8d97a0" />
            <stop offset="35%" stopColor="#e2e8eb" />
            <stop offset="55%" stopColor="#cfd6da" />
            <stop offset="100%" stopColor="#7c878f" />
          </linearGradient>
        </defs>

        {/* Glass body */}
        <ellipse cx="80" cy="155" rx="62" ry="34" fill="url(#lampGlass)" stroke="#7c9aa5" strokeWidth="1.5" />
        <path
          d="M22 155 C22 130 38 110 60 105 L100 105 C122 110 138 130 138 155"
          fill="url(#lampGlass)"
          stroke="#7c9aa5"
          strokeWidth="1.5"
        />
        {/* Highlight */}
        <ellipse cx="55" cy="135" rx="14" ry="22" fill="#ffffff" opacity="0.45" />

        {/* Oil pool inside */}
        <ellipse cx="80" cy="170" rx="48" ry="14" fill="url(#oilPool)" opacity="0.85" />

        {/* Neck */}
        <rect x="64" y="92" width="32" height="16" rx="3" fill="#cfdadf" stroke="#7c9aa5" strokeWidth="1.2" />
        {/* Neck threads (visible when uncapped) */}
        {uncapped && (
          <>
            <line x1="64" y1="96" x2="96" y2="96" stroke="#9aa9b0" strokeWidth="0.6" />
            <line x1="64" y1="100" x2="96" y2="100" stroke="#9aa9b0" strokeWidth="0.6" />
            <line x1="64" y1="104" x2="96" y2="104" stroke="#9aa9b0" strokeWidth="0.6" />
          </>
        )}

        {/* Wick (visible always; just darker when burning) */}
        <rect x="76" y="68" width="8" height="34" rx="2" fill={lit ? "#3d2c1f" : "#8a6543"} />
        {/* Wick top */}
        <ellipse cx="80" cy="68" rx="6" ry="3" fill={lit ? "#2a1c12" : "#a17856"} />
      </svg>

      {/* Detachable silver cap */}
      <motion.div
        animate={
          uncapped
            ? { x: 90, y: 80, rotate: 28 }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={{ position: "absolute", left: 56, top: 8, width: 48, height: 84 }}
      >
        <svg width="48" height="84" viewBox="0 0 48 84">
          <defs>
            <linearGradient id="capBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c878f" />
              <stop offset="30%" stopColor="#dde3e7" />
              <stop offset="55%" stopColor="#b8c1c6" />
              <stop offset="100%" stopColor="#6c757d" />
            </linearGradient>
          </defs>
          {/* Domed top */}
          <path d="M6 26 C6 6 42 6 42 26 L42 70 L6 70 Z" fill="url(#capBody)" stroke="#5b6770" strokeWidth="1.2" />
          {/* Knurled band */}
          <rect x="6" y="56" width="36" height="6" fill="#959fa5" />
          <line x1="9" y1="56" x2="9" y2="62" stroke="#717a82" strokeWidth="0.6" />
          <line x1="15" y1="56" x2="15" y2="62" stroke="#717a82" strokeWidth="0.6" />
          <line x1="21" y1="56" x2="21" y2="62" stroke="#717a82" strokeWidth="0.6" />
          <line x1="27" y1="56" x2="27" y2="62" stroke="#717a82" strokeWidth="0.6" />
          <line x1="33" y1="56" x2="33" y2="62" stroke="#717a82" strokeWidth="0.6" />
          <line x1="39" y1="56" x2="39" y2="62" stroke="#717a82" strokeWidth="0.6" />
          {/* Highlight */}
          <ellipse cx="18" cy="20" rx="4" ry="12" fill="#ffffff" opacity="0.6" />
          {/* Base ring (overhang) */}
          <rect x="2" y="68" width="44" height="6" rx="2" fill="#5b6770" />
        </svg>
      </motion.div>
    </div>
  );
}
