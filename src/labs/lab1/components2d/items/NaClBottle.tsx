"use client";

interface Props {
  /** Optional drip-trigger flag (kept for API compatibility). */
  pressed?: boolean;
}

/**
 * NaCl 0.9% dropper bottle — modelled on the KazNMU virtual-lab reference:
 * a clear glass bottle with a white dropper cap + glass pipette, pale-blue
 * saline inside, a white "NaCL 0.9%" label, glossy glass highlights and a
 * soft ground shadow for a 3D feel.
 */
export function NaClBottle({ pressed }: Props) {
  return (
    <svg width="54" height="104" viewBox="0 0 54 104" style={{ overflow: "visible", filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.22))" }}>
      <defs>
        <linearGradient id="naclGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cfe6ee" stopOpacity="0.85" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#dcecf2" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a9c9d4" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="naclLiquid3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d6eef6" />
          <stop offset="100%" stopColor="#8fcbe0" />
        </linearGradient>
        <linearGradient id="naclCap" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c7ccd0" />
          <stop offset="45%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#b3b9be" />
        </linearGradient>
      </defs>

      {/* White dropper cap */}
      <rect x="18" y="6" width="18" height="14" rx="2.5" fill="url(#naclCap)" stroke="#9aa3a9" strokeWidth="0.8" />
      <rect x="23" y="2" width="8" height="6" rx="2" fill="#e9edf0" stroke="#9aa3a9" strokeWidth="0.6" />
      {/* Glass pipette stem dipping into the liquid */}
      <rect x="25.5" y="20" width="3" height="16" rx="1.4" fill="#bfe0ec" opacity="0.85" />

      {/* Neck */}
      <rect x="20" y="20" width="14" height="8" rx="1.5" fill="url(#naclGlass)" stroke="#7ba0ac" strokeWidth="0.8" />

      {/* Bottle body */}
      <path
        d="M11 38 Q11 30 17 30 L37 30 Q43 30 43 38 L43 92 Q43 98 37 98 L17 98 Q11 98 11 92 Z"
        fill="url(#naclGlass)"
        stroke="#7ba0ac"
        strokeWidth="1.1"
      />
      {/* Saline level */}
      <path d="M13 56 L41 56 L41 91 Q41 96 37 96 L17 96 Q13 96 13 91 Z" fill="url(#naclLiquid3)" opacity="0.85" />

      {/* Label */}
      <rect x="15" y="60" width="24" height="26" rx="2" fill="#ffffff" stroke="#9bb6bf" strokeWidth="0.6" opacity="0.96" />
      <text x="27" y="72" textAnchor="middle" fontFamily="sans-serif" fontSize="8" fontWeight="bold" fill="#1f5066">NaCL</text>
      <text x="27" y="81" textAnchor="middle" fontFamily="sans-serif" fontSize="6" fill="#3f7186">0.9%</text>

      {/* Glass specular highlights */}
      <rect x="14" y="40" width="3.5" height="52" rx="1.6" fill="#ffffff" opacity="0.6" />
      <rect x="37" y="44" width="2" height="40" rx="1" fill="#ffffff" opacity="0.3" />

      {pressed && <circle cx="27" cy="100" r="2.4" fill="#8fcbe0" />}
    </svg>
  );
}
