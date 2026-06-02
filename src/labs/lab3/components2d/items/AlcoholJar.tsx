"use client";

interface Props {
  width?: number;
}

/**
 * Tall glass jar of alcohol — the Drigalski spreader is dipped here and then
 * flamed (and rests in it between uses). A clear cylindrical beaker with an
 * alcohol level, glass specular highlights and a soft base shadow.
 */
export function AlcoholJar({ width = 80 }: Props) {
  const w = width;
  const h = w * (170 / 80);
  return (
    <svg width={w} height={h} viewBox="0 0 80 170" style={{ overflow: "visible", filter: "drop-shadow(0 6px 7px rgba(0,0,0,0.22))" }}>
      <defs>
        <linearGradient id="ajGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c4d4db" stopOpacity="0.5" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.82" />
          <stop offset="70%" stopColor="#e7eef1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a9bcc4" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="ajLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eef6f8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#cfe0e6" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {/* Base shadow */}
      <ellipse cx="40" cy="162" rx="30" ry="6" fill="#000" opacity="0.14" />

      {/* Jar body */}
      <path d="M14 24 L66 24 L64 154 Q64 162 56 162 L24 162 Q16 162 16 154 Z" fill="url(#ajGlass)" stroke="#90a4ac" strokeWidth="1.4" />
      {/* Alcohol level */}
      <path d="M17 70 L63 70 L62 154 Q62 160 56 160 L24 160 Q18 160 18 154 Z" fill="url(#ajLiquid)" />
      {/* Liquid surface ellipse */}
      <ellipse cx="40" cy="70" rx="23" ry="4.5" fill="#dfeef2" opacity="0.7" />

      {/* Rim */}
      <ellipse cx="40" cy="24" rx="26" ry="6" fill="#eef4f6" opacity="0.7" stroke="#90a4ac" strokeWidth="1.2" />

      {/* Specular highlights */}
      <rect x="21" y="30" width="4" height="120" rx="2" fill="#ffffff" opacity="0.6" />
      <rect x="29" y="34" width="1.6" height="110" rx="0.8" fill="#ffffff" opacity="0.35" />

      {/* Label */}
      <rect x="26" y="100" width="28" height="22" rx="2" fill="#f6f6f2" opacity="0.92" stroke="#cfcabd" strokeWidth="0.6" />
      <text x="40" y="114" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="#5b6770">spirt</text>
    </svg>
  );
}
