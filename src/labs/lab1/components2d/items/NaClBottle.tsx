"use client";

interface Props {
  /** Slight squeeze animation when dispensing. */
  pressed?: boolean;
}

/**
 * Small dropper bottle of 0.9% NaCl saline with a clear pale-blue body and
 * white label. Reference frame 46 (top-right).
 */
export function NaClBottle({ pressed }: Props) {
  return (
    <svg width="50" height="100" viewBox="0 0 50 100">
      <defs>
        <linearGradient id="naclLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dff0f6" />
          <stop offset="100%" stopColor="#88c5d8" />
        </linearGradient>
      </defs>
      {/* Dropper top */}
      <rect x="20" y="0" width="10" height="14" rx="1" fill="#4a4a4a" />
      <rect x="22" y="14" width="6" height="6" rx="1" fill="#2a2a2a" />
      {/* Bulb */}
      <ellipse cx="25" cy="22" rx={pressed ? 7 : 8} ry={pressed ? 4 : 6} fill="#e57879" stroke="#a3493a" strokeWidth="1" />
      {/* Bottle neck */}
      <rect x="20" y="28" width="10" height="4" fill="#a8d4e0" stroke="#5a8c9a" strokeWidth="0.8" />
      {/* Bottle body */}
      <rect x="10" y="32" width="30" height="60" rx="3" fill="url(#naclLiquid)" stroke="#5a8c9a" strokeWidth="1" />
      {/* Label */}
      <rect x="14" y="44" width="22" height="22" rx="1" fill="#ffffff" stroke="#5a8c9a" strokeWidth="0.6" />
      <text x="25" y="55" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="#1f3a4a">
        NaCl
      </text>
      <text x="25" y="62" textAnchor="middle" fontFamily="sans-serif" fontSize="5" fill="#4a5a64">
        0.9%
      </text>
      {/* Highlight */}
      <rect x="13" y="38" width="3" height="50" rx="1" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}
