"use client";

interface Props {
  width?: number;
  /** Glows hot just after flaming. */
  hot?: boolean;
}

/**
 * Drigalski spreader — a glass rod with a long straight handle bending down into
 * a flat triangular spreading foot (the classic "hockey-stick"/triangle glass
 * spreader). Drawn lying mostly horizontal with the spreading foot at the left.
 */
export function DrigalskiSpatula({ width = 200, hot }: Props) {
  const w = width;
  const h = w * (70 / 200);
  const glow = hot
    ? "drop-shadow(0 0 7px rgba(255,150,40,0.8))"
    : "drop-shadow(0 3px 4px rgba(0,0,0,0.25))";
  return (
    <svg width={w} height={h} viewBox="0 0 200 70" style={{ overflow: "visible", filter: glow }}>
      <defs>
        <linearGradient id="dsGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f2f6f8" />
          <stop offset="45%" stopColor="#d4dde2" />
          <stop offset="100%" stopColor="#9aa6ad" />
        </linearGradient>
      </defs>

      {/* Triangular spreading foot (left, lying flat) */}
      <path
        d="M10 50 L52 38 L46 52 Z"
        fill="none"
        stroke={hot ? "#ff7a2a" : "url(#dsGlass)"}
        strokeWidth="5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Bend from foot up into the handle */}
      <path d="M49 45 Q60 40 70 34" fill="none" stroke={hot ? "#ff8c3a" : "url(#dsGlass)"} strokeWidth="5" strokeLinecap="round" />

      {/* Long straight handle */}
      <rect x="68" y="30" width="120" height="6" rx="3" fill="url(#dsGlass)" stroke="#8a969d" strokeWidth="0.6" transform="rotate(-6 128 33)" />
      <rect x="74" y="31" width="100" height="1.6" rx="0.8" fill="#ffffff" opacity="0.6" transform="rotate(-6 128 33)" />

      {/* Hot tint on the working foot */}
      {hot && <path d="M10 50 L52 38 L46 52 Z" fill="none" stroke="#ffd27a" strokeWidth="1.6" strokeLinejoin="round" opacity="0.8" />}
    </svg>
  );
}
