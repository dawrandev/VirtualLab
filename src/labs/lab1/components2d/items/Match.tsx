"use client";

import { motion } from "framer-motion";
import { Flame } from "../animations/Flame";

interface Props {
  /** 0..1 — 1 means fresh, 0 means fully burned. */
  burnProgress: number;
  lit: boolean;
  burned: boolean;
}

/**
 * Wooden matchstick. Head is brick-red until lit; once lit a small warm
 * flame rides the tip while the stick shrinks and chars from the head end.
 * Reference frames 03-08.
 */
export function Match({ burnProgress, lit, burned }: Props) {
  const stickLen = 70 - burnProgress * 30; // 70 → 40 over the burn
  const charColor = burned ? "#1f1f1f" : lit ? blendChar(burnProgress) : "#a16207";

  return (
    <div style={{ position: "relative", width: 100, height: 32 }}>
      <svg width="100" height="32" viewBox="0 0 100 32" style={{ position: "absolute", left: 0, top: 0 }}>
        {/* Stick (right edge fixed: user holds it from the right tail) */}
        <rect x={92 - stickLen} y="14" width={stickLen} height="4" rx="2" fill={charColor} />
        <rect x={92 - stickLen} y="14" width={stickLen} height="2" rx="1" fill="#ffffff" opacity="0.18" />

        {/* Head (left tip) */}
        {!burned && (
          <ellipse cx={92 - stickLen - 2} cy="16" rx="5" ry="4" fill={lit ? "#36281b" : "#c83e28"} />
        )}
      </svg>

      {/* Flame at the head */}
      {lit && !burned && (
        <div
          style={{
            position: "absolute",
            left: 92 - stickLen - 18,
            top: -34,
            width: 32,
            height: 50,
            pointerEvents: "none",
          }}
        >
          <Flame width={32} height={50} intensity={1} preset="match" />
        </div>
      )}

      {/* Tiny puff when burned out */}
      {burned && (
        <motion.div
          initial={{ opacity: 0.6, y: -10 }}
          animate={{ opacity: 0, y: -40 }}
          transition={{ duration: 1.2 }}
          style={{
            position: "absolute",
            left: 92 - stickLen - 10,
            top: -10,
            width: 20,
            height: 20,
            borderRadius: 10,
            background: "#999",
            filter: "blur(4px)",
          }}
        />
      )}
    </div>
  );
}

function blendChar(t: number): string {
  // brown -> dark gray
  const r = Math.round(0xa1 + (0x1f - 0xa1) * t);
  const g = Math.round(0x62 + (0x1f - 0x62) * t);
  const b = Math.round(0x07 + (0x1f - 0x07) * t);
  return `rgb(${r},${g},${b})`;
}
