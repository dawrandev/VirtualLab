"use client";

/**
 * Immersion oil — small squat amber bottle with a black dropper cap and a
 * thick, viscous golden meniscus. Labelled "Immersion Oil / n=1.515".
 * Min rendered size ≈ 50×96 px.
 */
export function ImmersionOilBottle() {
  return (
    <svg width="50" height="96" viewBox="0 0 50 96" style={{ overflow: "visible", filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.25))" }}>
      <defs>
        <linearGradient id="oilGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6e4413" />
          <stop offset="25%" stopColor="#a9742c" />
          <stop offset="50%" stopColor="#d8a956" />
          <stop offset="75%" stopColor="#9c6824" />
          <stop offset="100%" stopColor="#5e3a10" />
        </linearGradient>
        <linearGradient id="oilLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0c45a" />
          <stop offset="100%" stopColor="#b07e1c" />
        </linearGradient>
      </defs>

      {/* Black cap with dropper */}
      <rect x="17" y="2" width="16" height="12" rx="2" fill="#1c1c1c" />
      <rect x="22" y="0" width="6" height="4" rx="1" fill="#333" />
      <rect x="23.5" y="14" width="3" height="12" rx="1.2" fill="#caa85e" opacity="0.85" />

      {/* Neck */}
      <rect x="18" y="14" width="14" height="8" rx="1.5" fill="url(#oilGlass)" stroke="#4a2f0c" strokeWidth="0.8" />

      {/* Squat body */}
      <path
        d="M9 30 Q9 22 16 22 L34 22 Q41 22 41 30 L41 86 Q41 92 35 92 L15 92 Q9 92 9 86 Z"
        fill="url(#oilGlass)"
        stroke="#4a2f0c"
        strokeWidth="1.1"
      />
      {/* Viscous oil at base */}
      <path d="M11 60 L39 60 L39 85 Q39 90 35 90 L15 90 Q11 90 11 85 Z" fill="url(#oilLiquid)" opacity="0.8" />

      {/* Label */}
      <rect x="12" y="40" width="26" height="22" rx="2" fill="#fff8ec" stroke="#8a6a2a" strokeWidth="0.7" />
      <text x="25" y="49" textAnchor="middle" fontFamily="sans-serif" fontSize="5.2" fontWeight="bold" fill="#5e3a10">
        IMMERS.
      </text>
      <text x="25" y="56" textAnchor="middle" fontFamily="sans-serif" fontSize="5.2" fontWeight="bold" fill="#5e3a10">
        OIL
      </text>
      <text x="25" y="61.5" textAnchor="middle" fontFamily="sans-serif" fontSize="3.6" fill="#8a6a2a">
        n=1.515
      </text>

      {/* Specular highlights — glossy 3D */}
      <rect x="12" y="30" width="3.6" height="52" rx="1.8" fill="#ffffff" opacity="0.5" />
      <rect x="16.5" y="32" width="1.4" height="46" rx="0.7" fill="#ffffff" opacity="0.26" />
      <ellipse cx="16" cy="32" rx="6" ry="3" fill="#ffffff" opacity="0.4" />
      {/* Right-edge soft shade */}
      <path d="M39 30 L39 86 Q39 92 33 92 L31 92 Q37 90 37 84 L37 32 Z" fill="#2a1606" opacity="0.18" />
    </svg>
  );
}
