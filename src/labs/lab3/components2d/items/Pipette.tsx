"use client";

interface Props {
  width?: number;
  /** Suspension drawn up into the barrel. */
  loaded?: boolean;
}

/**
 * Graduated glass measuring pipette with a small rubber bulb on top. When
 * `loaded` a column of cloudy suspension sits in the lower barrel. Drawn
 * vertical (tip at the bottom) as held over a plate.
 */
export function Pipette({ width = 30, loaded }: Props) {
  const w = width;
  const h = w * (190 / 30);
  return (
    <svg width={w} height={h} viewBox="0 0 30 190" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.22))" }}>
      <defs>
        <linearGradient id="pipGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cdd9e0" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#b6c5cd" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="pipBulb" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e98f6f" />
          <stop offset="100%" stopColor="#b85638" />
        </linearGradient>
      </defs>

      {/* Rubber bulb */}
      <ellipse cx="15" cy="12" rx="10" ry="12" fill="url(#pipBulb)" stroke="#9c4327" strokeWidth="0.8" />
      <ellipse cx="11" cy="8" rx="2.5" ry="4" fill="#ffffff" opacity="0.4" />

      {/* Barrel */}
      <rect x="10" y="22" width="10" height="138" rx="3" fill="url(#pipGlass)" stroke="#8aa0a8" strokeWidth="1" />
      {/* Graduation marks */}
      <g stroke="#8aa0a8" strokeWidth="0.6" opacity="0.7">
        {[40, 56, 72, 88, 104, 120, 136].map((y) => (
          <line key={y} x1="13" y1={y} x2="17" y2={y} />
        ))}
      </g>
      {/* Suspension column */}
      {loaded && <rect x="11" y="110" width="8" height="48" rx="2" fill="#d3e0d8" opacity="0.85" />}

      {/* Tapered tip */}
      <path d="M11 160 L19 160 L16 184 Q15 188 14 184 Z" fill="url(#pipGlass)" stroke="#8aa0a8" strokeWidth="0.8" />
      {loaded && <path d="M14 168 L16 168 L15.4 182 Q15 184 14.6 182 Z" fill="#d3e0d8" opacity="0.9" />}

      {/* Specular highlight */}
      <rect x="12" y="26" width="2" height="128" rx="1" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
