"use client";

interface Props {
  width?: number;
  /** Glows hot just after flaming (then cools). */
  hot?: boolean;
}

/**
 * Drigalski spreader — a stainless rod bent into a closed triangular spreading
 * head with a long tapering handle, modelled on the real instrument. The flat
 * bottom edge of the triangle is the spreading surface (at the left). Each
 * segment is drawn as a metal tube (steel gradient + a fine specular line) and
 * glows orange briefly after flaming.
 */
export function DrigalskiSpatula({ width = 220, hot }: Props) {
  const w = width;
  const h = w * (96 / 220);
  const glow = hot ? "drop-shadow(0 0 8px rgba(255,150,40,0.85))" : "drop-shadow(0 3px 4px rgba(0,0,0,0.25))";
  const steel = hot ? "#ff7e30" : "url(#dsSteel)";
  const sheen = hot ? "#ffd8a6" : "#ffffff";

  return (
    <svg width={w} height={h} viewBox="0 0 220 96" style={{ overflow: "visible", filter: glow }}>
      <defs>
        <linearGradient id="dsSteel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4f7f8" />
          <stop offset="40%" stopColor="#cdd6db" />
          <stop offset="62%" stopColor="#9aa6ad" />
          <stop offset="100%" stopColor="#6f7a81" />
        </linearGradient>
      </defs>

      {/* Triangular spreading head (closed loop), spreading edge at the bottom */}
      <path
        d="M70 44 L16 70 L62 72 L70 44 Z"
        fill="none"
        stroke={steel}
        strokeWidth="6.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Flat spreading edge accent (the part that rakes the agar) */}
      <path d="M16 70 L62 72" stroke={steel} strokeWidth="7.5" strokeLinecap="round" />

      {/* Long handle from the top vertex, tapering up to the right */}
      <path d="M70 44 L210 18" fill="none" stroke={steel} strokeWidth="7" strokeLinecap="round" />
      {/* Handle taper tip */}
      <path d="M198 20 L214 17" fill="none" stroke={steel} strokeWidth="5" strokeLinecap="round" />

      {/* Specular sheen lines for the cylindrical tube look */}
      <path d="M70 42 L208 16.5" stroke={sheen} strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
      <path d="M68 45 L18 69" stroke={sheen} strokeWidth="1.4" opacity="0.45" strokeLinecap="round" />
      <path d="M17 70 L60 72" stroke={sheen} strokeWidth="1.6" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}
