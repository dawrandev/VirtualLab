"use client";

import type { ReactNode } from "react";

interface Props {
  /** Optional slide overlay (positioned on the top horizontal bar). */
  children?: ReactNode;
}

/**
 * Wireframe two-tier slide drying rack (reference frame 46-47 top-right).
 * Simple white-grey metal lines with subtle shadow.
 */
export function DryingRack({ children }: Props) {
  return (
    <div style={{ position: "relative", width: 240, height: 150 }}>
      <svg width="240" height="150" viewBox="0 0 240 150" style={{ position: "absolute", inset: 0 }}>
        {/* Vertical posts */}
        <line x1="10" y1="10" x2="10" y2="130" stroke="#a3afb8" strokeWidth="3" />
        <line x1="230" y1="10" x2="230" y2="130" stroke="#a3afb8" strokeWidth="3" />
        {/* Top tier */}
        <line x1="10" y1="40" x2="230" y2="40" stroke="#a3afb8" strokeWidth="3" />
        <line x1="10" y1="55" x2="230" y2="55" stroke="#a3afb8" strokeWidth="3" />
        {/* Bottom tier */}
        <line x1="10" y1="100" x2="230" y2="100" stroke="#a3afb8" strokeWidth="3" />
        <line x1="10" y1="115" x2="230" y2="115" stroke="#a3afb8" strokeWidth="3" />
        {/* Cross supports */}
        <line x1="10" y1="40" x2="10" y2="130" stroke="#a3afb8" strokeWidth="3" />
        <line x1="230" y1="40" x2="230" y2="130" stroke="#a3afb8" strokeWidth="3" />
        {/* Vertical drying thermometer-like rod (decorative center) */}
        <line x1="120" y1="5" x2="120" y2="130" stroke="#7a878f" strokeWidth="1.4" />
        <circle cx="120" cy="6" r="3" fill="#7a878f" />
        {/* Base shadow */}
        <ellipse cx="120" cy="142" rx="115" ry="4" fill="#000" opacity="0.15" />
      </svg>
      {children}
    </div>
  );
}
