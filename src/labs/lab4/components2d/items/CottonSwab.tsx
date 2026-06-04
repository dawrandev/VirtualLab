"use client";

interface Props {
  width?: number;
  /** Cotton tip soaked with the inoculum (charged). */
  charged?: boolean;
}

/**
 * Sterile cotton swab — a thin wooden applicator stick with a fluffy cotton
 * head, the standard Kirby-Bauer tool for spreading the inoculum as an even
 * lawn. When `charged` the cotton is damp/tinted with the bacterial suspension.
 */
export function CottonSwab({ width = 200, charged }: Props) {
  const w = width;
  const h = w * (44 / 200);
  return (
    <svg width={w} height={h} viewBox="0 0 200 44" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.22))" }}>
      <defs>
        <linearGradient id="csStick" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0e0bf" />
          <stop offset="50%" stopColor="#dcc596" />
          <stop offset="100%" stopColor="#b89a63" />
        </linearGradient>
        <radialGradient id="csCotton" cx="40%" cy="38%" r="65%">
          <stop offset="0%" stopColor={charged ? "#eef0e6" : "#fdfcf7"} />
          <stop offset="70%" stopColor={charged ? "#d7dcc8" : "#efece0"} />
          <stop offset="100%" stopColor={charged ? "#c2caa8" : "#ddd8c6"} />
        </radialGradient>
      </defs>

      {/* Wooden stick */}
      <rect x="34" y="20" width="160" height="4.5" rx="2.25" fill="url(#csStick)" stroke="#a98b56" strokeWidth="0.5" />
      <rect x="40" y="20.6" width="140" height="1.2" rx="0.6" fill="#fff7e2" opacity="0.6" />

      {/* Cotton head (left working end) */}
      <ellipse cx="20" cy="22" rx="20" ry="12" fill="url(#csCotton)" stroke={charged ? "#b3bb92" : "#cabfa6"} strokeWidth="0.8" />
      {/* fibre wisps */}
      <g stroke={charged ? "#b9c099" : "#d8cfb8"} strokeWidth="0.6" opacity="0.7" fill="none">
        <path d="M8 16 Q14 22 9 30" />
        <path d="M20 12 Q22 22 20 32" />
        <path d="M32 15 Q28 22 33 30" />
      </g>
      <ellipse cx="14" cy="17" rx="6" ry="3.4" fill="#ffffff" opacity={charged ? 0.4 : 0.7} />
      {/* damp sheen when charged */}
      {charged && <ellipse cx="20" cy="24" rx="13" ry="7" fill="#cfd9be" opacity="0.5" />}
    </svg>
  );
}
