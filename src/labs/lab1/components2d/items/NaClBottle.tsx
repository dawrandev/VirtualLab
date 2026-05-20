"use client";

interface Props {
  /** Optional spray-trigger animation flag. */
  pressed?: boolean;
}

/**
 * NaCl 0.9% spray bottle — reference seg2_14/18: white nozzle top, clear
 * blue body, "NaCL 0.9%" label. Drop-in replacement for the old dropper
 * design so positions/zones don't need to change.
 */
export function NaClBottle({ pressed }: Props) {
  return (
    <svg width="50" height="100" viewBox="0 0 50 100">
      <defs>
        <linearGradient id="naclLiquid2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0eff5" />
          <stop offset="100%" stopColor="#86c4d7" />
        </linearGradient>
        <linearGradient id="naclNozzle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#dadcde" />
          <stop offset="55%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#aab1b5" />
        </linearGradient>
      </defs>

      {/* Nozzle base (white trigger ring) */}
      <rect x="14" y="8" width="22" height="10" rx="2" fill="url(#naclNozzle)" stroke="#5b6770" strokeWidth="0.8" />
      {/* Spray cap top */}
      <path d="M16 8 Q25 0 34 8 Z" fill="#e8ebed" stroke="#5b6770" strokeWidth="0.8" />
      {/* Trigger lever */}
      <path d="M14 14 L8 12 L8 18 L14 16 Z" fill="#cdd3d8" stroke="#5b6770" strokeWidth="0.6" />
      {/* Spray dust (when pressed) */}
      {pressed && (
        <>
          <circle cx="40" cy="6" r="1" fill="#b8d6e2" />
          <circle cx="44" cy="9" r="0.8" fill="#b8d6e2" />
          <circle cx="42" cy="12" r="0.6" fill="#b8d6e2" />
        </>
      )}

      {/* Bottle neck */}
      <rect x="19" y="18" width="12" height="6" fill="#a8d4e0" stroke="#5a8c9a" strokeWidth="0.8" />
      {/* Bottle body */}
      <path
        d="M8 30 Q8 24 12 24 L38 24 Q42 24 42 30 L42 88 Q42 94 38 94 L12 94 Q8 94 8 88 Z"
        fill="url(#naclLiquid2)"
        stroke="#5a8c9a"
        strokeWidth="1"
      />
      {/* Label */}
      <rect x="13" y="42" width="24" height="26" rx="1.5" fill="#ffffff" stroke="#5a8c9a" strokeWidth="0.7" />
      <text x="25" y="54" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="#1f3a4a">
        NaCl
      </text>
      <text x="25" y="63" textAnchor="middle" fontFamily="sans-serif" fontSize="5" fill="#4a5a64">
        0.9%
      </text>
      {/* Liquid highlight */}
      <rect x="11" y="32" width="3" height="56" rx="1" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
