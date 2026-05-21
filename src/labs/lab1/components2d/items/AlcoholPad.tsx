"use client";

/**
 * Alcohol prep pad — a foil-wrapped sachet with the white cloth pad peeking
 * out of the torn top. Used to clean and defat the glass slide before use.
 */
export function AlcoholPad() {
  return (
    <svg width="74" height="92" viewBox="0 0 74 92">
      <defs>
        <linearGradient id="apFoil" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#dfe6ea" />
          <stop offset="45%" stopColor="#aab6bd" />
          <stop offset="55%" stopColor="#c9d3d8" />
          <stop offset="100%" stopColor="#8c989f" />
        </linearGradient>
        <linearGradient id="apCloth" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e6eef0" />
        </linearGradient>
      </defs>

      {/* Drop shadow */}
      <rect x="10" y="20" width="58" height="68" rx="4" fill="#000" opacity="0.12" />

      {/* Foil sachet */}
      <rect x="8" y="14" width="58" height="72" rx="4" fill="url(#apFoil)" stroke="#7d888f" strokeWidth="1" />
      {/* Crinkle highlights */}
      <path d="M18 20 L24 86 M34 18 L30 86 M48 20 L52 84" stroke="#ffffff" strokeWidth="0.8" opacity="0.35" />
      <path d="M14 40 L60 36 M14 60 L60 64" stroke="#6e7a82" strokeWidth="0.6" opacity="0.3" />

      {/* White cloth pad peeking from torn top */}
      <path d="M14 14 Q24 4 37 8 Q50 4 60 14 L60 22 L14 22 Z" fill="url(#apCloth)" stroke="#cfd8db" strokeWidth="0.8" />
      <path d="M16 12 H58" stroke="#dfe6e8" strokeWidth="0.6" opacity="0.7" />

      {/* Label band */}
      <rect x="14" y="46" width="46" height="18" rx="2" fill="#1f8a5b" opacity="0.92" />
      <text x="37" y="54" textAnchor="middle" fontFamily="sans-serif" fontSize="6" fontWeight="bold" fill="#ffffff">
        ALCOHOL
      </text>
      <text x="37" y="61" textAnchor="middle" fontFamily="sans-serif" fontSize="5" fill="#dff3e8">
        70% prep pad
      </text>
    </svg>
  );
}
