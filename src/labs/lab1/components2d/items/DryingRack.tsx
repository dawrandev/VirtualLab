"use client";

import type { ReactNode } from "react";

interface Props {
  /** Optional children overlaid in absolute coordinates (e.g., slide on bottom tier). */
  children?: ReactNode;
}

/**
 * Two-tier metal drying/holding rack — reference seg2_06 and seg2_11.
 * Top tier is a tall vertical frame (holds the loop standing up).
 * Bottom tier is a long horizontal frame (holds the slide horizontally).
 * Both are simple white-grey wire silhouettes.
 */
export function DryingRack({ children }: Props) {
  return (
    <div style={{ position: "relative", width: 270, height: 220 }}>
      <svg width="270" height="220" viewBox="0 0 270 220" style={{ position: "absolute", inset: 0 }}>
        {/* --- Top tier (vertical loop holder) --- */}
        {/* Outer rectangle */}
        <rect x="14" y="6" width="242" height="86" rx="3" fill="none" stroke="#a3afb8" strokeWidth="3" />
        {/* Vertical center post (visual anchor for the loop) */}
        <line x1="135" y1="6" x2="135" y2="92" stroke="#7a878f" strokeWidth="1.4" />
        <circle cx="135" cy="6" r="3" fill="#7a878f" />

        {/* --- Bottom tier (horizontal slide rest) --- */}
        <rect x="14" y="110" width="242" height="40" rx="3" fill="none" stroke="#a3afb8" strokeWidth="3" />
        {/* Internal slide rails */}
        <line x1="14" y1="124" x2="256" y2="124" stroke="#a3afb8" strokeWidth="1.2" />
        <line x1="14" y1="136" x2="256" y2="136" stroke="#a3afb8" strokeWidth="1.2" />

        {/* Ground shadow under whole rack */}
        <ellipse cx="135" cy="158" rx="120" ry="4" fill="#000" opacity="0.18" />
      </svg>
      {children}
    </div>
  );
}
