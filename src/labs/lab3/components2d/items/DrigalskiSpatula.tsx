"use client";

interface Props {
  width?: number;
  /** Glows hot just after flaming (then cools). Only the working triangular
   *  end reaches red-hot — the handle stays cool, as in real sterilization. */
  hot?: boolean;
  /** Working end freshly dipped in alcohol (glistening) — before flaming. */
  wet?: boolean;
}

/**
 * Drigalski spreader — a stainless rod bent into a closed triangular spreading
 * head with a long tapering handle, modelled on the real instrument. The flat
 * bottom edge of the triangle is the spreading surface (at the left). Only the
 * working triangle reddens in the flame (dip in alcohol → flame); the handle
 * stays metallic.
 */
export function DrigalskiSpatula({ width = 220, hot, wet }: Props) {
  const w = width;
  const h = w * (96 / 220);
  const steel = "url(#dsSteel)";
  const head = hot ? "url(#dsHot)" : "url(#dsSteel)";

  return (
    <svg width={w} height={h} viewBox="0 0 220 96" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.25))" }}>
      <defs>
        <linearGradient id="dsSteel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f4f7f8" />
          <stop offset="40%" stopColor="#cdd6db" />
          <stop offset="62%" stopColor="#9aa6ad" />
          <stop offset="100%" stopColor="#6f7a81" />
        </linearGradient>
        {/* Dull red-hot, brightest at the tip — only the working end */}
        <linearGradient id="dsHot" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e25822" />
          <stop offset="55%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#9a5a3a" />
        </linearGradient>
      </defs>

      {/* Soft heat halo localized at the triangular working end */}
      {hot && <ellipse cx="42" cy="62" rx="40" ry="30" fill="#ff7a2a" opacity="0.22" style={{ filter: "blur(5px)" }} />}

      {/* Long handle from the top vertex (always cool steel) */}
      <path d="M70 44 L210 18" fill="none" stroke={steel} strokeWidth="7" strokeLinecap="round" />
      <path d="M198 20 L214 17" fill="none" stroke={steel} strokeWidth="5" strokeLinecap="round" />
      {/* Short cool section just above the head, fading to hot */}
      <path d="M70 44 L96 39" fill="none" stroke={steel} strokeWidth="6.8" strokeLinecap="round" />

      {/* Triangular spreading head (closed loop) — reddens when flamed */}
      <path d="M70 44 L16 70 L62 72 L70 44 Z" fill="none" stroke={head} strokeWidth="6.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Flat spreading edge accent (rakes the agar) */}
      <path d="M16 70 L62 72" stroke={head} strokeWidth="7.5" strokeLinecap="round" />

      {/* Specular sheen — only on the cool steel parts */}
      <path d="M72 42 L208 16.5" stroke="#ffffff" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" />
      {!hot && <path d="M68 45 L18 69" stroke="#ffffff" strokeWidth="1.4" opacity="0.45" strokeLinecap="round" />}
      {/* Hot tip highlight */}
      {hot && <path d="M18 69 L60 71" stroke="#ffd9a0" strokeWidth="1.6" opacity="0.7" strokeLinecap="round" />}

      {/* Alcohol-wet working end — glistening highlight + a couple of drips */}
      {wet && !hot && (
        <g>
          <path d="M70 44 L16 70 L62 72 L70 44 Z" fill="none" stroke="#cfe6f0" strokeWidth="2.2" strokeLinejoin="round" opacity="0.85" />
          <circle cx="20" cy="74" r="2.2" fill="#bfe0ee" opacity="0.85" />
          <circle cx="44" cy="76" r="1.8" fill="#bfe0ee" opacity="0.8" />
        </g>
      )}
    </svg>
  );
}
