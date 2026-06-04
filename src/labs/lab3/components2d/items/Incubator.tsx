"use client";

interface Props {
  width?: number;
  /** Dishes are inside and incubating (door shut, indicator lit). */
  running?: boolean;
  /** How many plates are visible on the shelves (default 3). */
  plates?: number;
}

/**
 * Laboratory incubator / thermostat — a white enamel cabinet with a glass inner
 * door, a digital 37 °C readout and a handle. Plates are placed inside to
 * incubate 18–24 h. A green indicator lights while running.
 */
export function Incubator({ width = 200, running, plates = 3 }: Props) {
  const w = width;
  const h = w * (250 / 200);
  const plateYs = [116, 164, 208];
  return (
    <svg width={w} height={h} viewBox="0 0 200 250" style={{ overflow: "visible", filter: "drop-shadow(0 8px 9px rgba(0,0,0,0.26))" }}>
      <defs>
        <linearGradient id="incBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fdfdfd" />
          <stop offset="50%" stopColor="#eceef0" />
          <stop offset="100%" stopColor="#cdd2d6" />
        </linearGradient>
        <linearGradient id="incDoor" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f4f6f7" />
          <stop offset="100%" stopColor="#d8dde0" />
        </linearGradient>
        <linearGradient id="incGlass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b9d3da" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#e7f0f2" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#9bb6bd" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="100" cy="242" rx="86" ry="9" fill="#000" opacity="0.16" />

      {/* Cabinet body */}
      <rect x="18" y="10" width="164" height="226" rx="8" fill="url(#incBody)" stroke="#a9b0b5" strokeWidth="1.4" />
      {/* Side seam */}
      <rect x="168" y="14" width="10" height="218" rx="4" fill="#c2c8cc" opacity="0.7" />

      {/* Control panel */}
      <rect x="30" y="20" width="140" height="34" rx="4" fill="#2c3137" />
      {/* Digital readout */}
      <rect x="38" y="27" width="62" height="20" rx="3" fill="#0c1a12" />
      <text x="69" y="42" textAnchor="middle" fontFamily="'Courier New', monospace" fontSize="14" fontWeight="bold" fill={running ? "#46e08a" : "#2f6f48"}>
        37.0°
      </text>
      {/* Indicator light */}
      <circle cx="120" cy="37" r="5" fill={running ? "#34d399" : "#5b6168"} stroke="#1d2227" strokeWidth="0.8" />
      {running && <circle cx="120" cy="37" r="8" fill="#34d399" opacity="0.3" />}
      {/* Knob */}
      <circle cx="150" cy="37" r="7" fill="#3f464d" stroke="#1d2227" strokeWidth="0.8" />
      <line x1="150" y1="37" x2="150" y2="31" stroke="#cdd2d6" strokeWidth="1.4" strokeLinecap="round" />

      {/* Door */}
      <rect x="30" y="62" width="140" height="164" rx="6" fill="url(#incDoor)" stroke="#aab1b6" strokeWidth="1.2" />
      {/* Inner glass window */}
      <rect x="42" y="74" width="104" height="140" rx="4" fill="url(#incGlass)" stroke="#9bb6bd" strokeWidth="1.4" />
      {/* Shelves visible through glass */}
      <g stroke="#9bb6bd" strokeWidth="1.4" opacity="0.6">
        <line x1="46" y1="120" x2="142" y2="120" />
        <line x1="46" y1="168" x2="142" y2="168" />
      </g>
      {/* Plates stacked inside when running (one per shelf) */}
      {running && (
        <g opacity="0.85">
          {plateYs.slice(0, Math.max(0, Math.min(3, plates))).map((y) => (
            <ellipse key={y} cx="94" cy={y} rx="34" ry="7" fill="#e7e7bf" stroke="#b3b85a" strokeWidth="0.8" />
          ))}
        </g>
      )}
      {/* Glass reflection */}
      <polygon points="52,78 70,78 50,210 42,210" fill="#ffffff" opacity="0.18" />

      {/* Handle */}
      <rect x="150" y="120" width="9" height="48" rx="4" fill="#aab1b6" stroke="#878e93" strokeWidth="0.8" />
      <rect x="151.5" y="124" width="2.4" height="40" rx="1.2" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}
