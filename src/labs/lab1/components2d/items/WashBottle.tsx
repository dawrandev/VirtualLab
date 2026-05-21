"use client";

/**
 * Distilled-water wash bottle with an angled nozzle. Semi-3D glass look: a
 * cylindrical body gradient (dark edges → bright centre), a crisp specular
 * highlight stripe, a softer right-edge reflection and a soft ground shadow.
 */
export function WashBottle() {
  return (
    <svg width="56" height="100" viewBox="0 0 56 100" style={{ overflow: "visible", filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.22))" }}>
      <defs>
        {/* Cylindrical glass body (horizontal = round volume) */}
        <linearGradient id="washBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9cc0cf" />
          <stop offset="18%" stopColor="#eaf6fb" />
          <stop offset="42%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#d7ebf2" />
          <stop offset="100%" stopColor="#8fb3c3" />
        </linearGradient>
        <linearGradient id="washFill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9fd0e0" />
          <stop offset="42%" stopColor="#d8f1f8" />
          <stop offset="100%" stopColor="#7fb9cc" />
        </linearGradient>
        <linearGradient id="washChrome" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7e898f" />
          <stop offset="40%" stopColor="#eef2f4" />
          <stop offset="60%" stopColor="#c4ccd0" />
          <stop offset="100%" stopColor="#6c767c" />
        </linearGradient>
      </defs>

      {/* Nozzle */}
      <path d="M30 4 L40 4 L40 18 L52 30" stroke="#4a5b65" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M31 4 L40 4 L40 17" stroke="#aebcc4" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* Cap (chrome) */}
      <rect x="22" y="0" width="20" height="8" rx="1.5" fill="url(#washChrome)" stroke="#525e65" strokeWidth="0.6" />

      {/* Body */}
      <rect x="10" y="14" width="40" height="76" rx="7" fill="url(#washBody)" stroke="#5f8492" strokeWidth="1.1" />
      {/* Water fill (lower 2/3) */}
      <path d="M11 40 L49 40 L49 83 Q49 89 43 89 L17 89 Q11 89 11 83 Z" fill="url(#washFill)" opacity="0.85" />
      {/* Meniscus */}
      <ellipse cx="30" cy="40" rx="19" ry="2.4" fill="#ffffff" opacity="0.4" />

      {/* Label */}
      <rect x="16" y="50" width="28" height="22" rx="2.5" fill="#ffffff" stroke="#6f93a0" strokeWidth="0.5" opacity="0.95" />
      <text x="30" y="62" textAnchor="middle" fontFamily="sans-serif" fontSize="7.5" fontWeight="bold" fill="#1f3a4a">H₂O</text>
      <text x="30" y="70" textAnchor="middle" fontFamily="sans-serif" fontSize="5" fill="#4a5a64">distil.</text>

      {/* Specular highlights */}
      <rect x="15" y="20" width="4" height="64" rx="2" fill="#ffffff" opacity="0.7" />
      <rect x="20" y="22" width="1.6" height="58" rx="0.8" fill="#ffffff" opacity="0.35" />
      <rect x="44" y="26" width="2.2" height="52" rx="1" fill="#ffffff" opacity="0.25" />
      {/* Top shoulder gloss */}
      <ellipse cx="24" cy="20" rx="9" ry="3" fill="#ffffff" opacity="0.45" />
    </svg>
  );
}
