"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Flame } from "../animations/Flame";

interface Props {
  uncapped: boolean;
  lit: boolean;
}

/**
 * Cartoon spirit lamp — reference seg2_06/11:
 *   - a clear glass bulb body (low-wide, almost ellipsoidal) with a golden
 *     oil pool at the bottom and a brown wick poking out of the top neck;
 *   - a small silver dome-cap that sits on the neck when capped and slides
 *     aside (200ms spring) when uncapped, revealing the wick.
 * Flame is rendered above the wick when `lit` is true; it fades in with a
 * brief scale-up spring so it doesn't pop into existence.
 */
export function SpiritLamp({ uncapped, lit }: Props) {
  // Wick is hidden when capped so the silhouette is clean.
  const wickVisible = uncapped || lit;
  return (
    <div style={{ position: "relative", width: 160, height: 200 }}>
      {/* Flame above the wick */}
      <div
        style={{
          position: "absolute",
          left: 80 - 18,
          top: 4,
          width: 36,
          height: 70,
          pointerEvents: "none",
        }}
      >
        <AnimatePresence>
          {lit && (
            <motion.div
              key="lamp-flame"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              style={{ originY: 1 }}
            >
              <Flame width={36} height={70} intensity={1} preset="lamp" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Glass body */}
      <svg
        width="160"
        height="200"
        viewBox="0 0 160 200"
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <defs>
          <radialGradient id="lampGlass" cx="35%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#dbeaef" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#9dbfca" stopOpacity="0.75" />
          </radialGradient>
          <linearGradient id="oilPool" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e9d27a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#b89a2f" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* Wide low bulb body — single closed path */}
        <path
          d="M22 165 C22 200 138 200 138 165 L138 150 C138 110 105 95 95 90 L95 110 L65 110 L65 90 C55 95 22 110 22 150 Z"
          fill="url(#lampGlass)"
          stroke="#7c9aa5"
          strokeWidth="1.6"
        />
        {/* Highlight on the bulb */}
        <ellipse cx="50" cy="145" rx="10" ry="20" fill="#ffffff" opacity="0.55" />

        {/* Oil pool */}
        <ellipse cx="80" cy="180" rx="50" ry="10" fill="url(#oilPool)" opacity="0.9" />
        {/* Oil meniscus highlight */}
        <ellipse cx="80" cy="172" rx="46" ry="2" fill="#ffffff" opacity="0.4" />

        {/* Neck collar */}
        <rect
          x="63"
          y="84"
          width="34"
          height="14"
          rx="3"
          fill="#cfdadf"
          stroke="#7c9aa5"
          strokeWidth="1.2"
        />

        {/* Wick (rendered only when uncapped or lit) */}
        {wickVisible && (
          <>
            <rect
              x="75"
              y="62"
              width="10"
              height="26"
              rx="2"
              fill={lit ? "#3d2c1f" : "#8a6543"}
            />
            <ellipse
              cx="80"
              cy="62"
              rx="7"
              ry="3"
              fill={lit ? "#2a1c12" : "#a17856"}
            />
          </>
        )}

        {/* Ground shadow */}
        <ellipse cx="80" cy="195" rx="58" ry="3" fill="#000" opacity="0.18" />
      </svg>

      {/* Detachable silver cap */}
      <motion.div
        animate={uncapped ? { x: 56, y: 68, rotate: 22 } : { x: 0, y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 26 }}
        style={{ position: "absolute", left: 60, top: 38, width: 40, height: 56 }}
      >
        <svg width="40" height="56" viewBox="0 0 40 56">
          <defs>
            <linearGradient id="capBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7c878f" />
              <stop offset="30%" stopColor="#e8eef1" />
              <stop offset="55%" stopColor="#bcc6cc" />
              <stop offset="100%" stopColor="#6c757d" />
            </linearGradient>
          </defs>
          {/* Dome cap */}
          <path
            d="M4 18 C4 2 36 2 36 18 L36 44 L4 44 Z"
            fill="url(#capBody)"
            stroke="#5b6770"
            strokeWidth="1.2"
          />
          {/* Highlight */}
          <ellipse cx="14" cy="14" rx="3" ry="9" fill="#ffffff" opacity="0.65" />
          {/* Base ring overhang */}
          <rect x="0" y="42" width="40" height="6" rx="2" fill="#5b6770" />
          {/* Inner dark line under the rim */}
          <line x1="2" y1="42" x2="38" y2="42" stroke="#3a4147" strokeWidth="0.8" />
        </svg>
      </motion.div>
    </div>
  );
}
