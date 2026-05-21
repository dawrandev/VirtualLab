"use client";

interface Props {
  width?: number;
}

/**
 * Inoculation-loop rest/stand — a small chrome wire stand with a horizontal
 * top bar resting on two V-legs. The loop is laid across the bar so it never
 * touches the bench surface (you place the loop here between steps).
 */
export function LoopStand({ width = 150 }: Props) {
  const w = width;
  const h = w * 0.6;
  return (
    <div style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 5px 6px rgba(0,0,0,0.22))" }}>
      <svg width={w} height={h} viewBox="0 0 150 90">
        <defs>
          <linearGradient id="lsChrome" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eef2f4" />
            <stop offset="45%" stopColor="#b9c2c8" />
            <stop offset="100%" stopColor="#7e878d" />
          </linearGradient>
          <linearGradient id="lsBar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9aa3a9" />
            <stop offset="45%" stopColor="#eef2f4" />
            <stop offset="100%" stopColor="#8b949a" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="75" cy="82" rx="60" ry="6" fill="#000" opacity="0.12" />

        {/* Left V-legs */}
        <path d="M26 80 L40 30 M54 80 L40 30" stroke="url(#lsChrome)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {/* Right V-legs */}
        <path d="M96 80 L110 30 M124 80 L110 30" stroke="url(#lsChrome)" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {/* Feet */}
        <ellipse cx="26" cy="80" rx="6" ry="2.4" fill="#7e878d" />
        <ellipse cx="54" cy="80" rx="6" ry="2.4" fill="#7e878d" />
        <ellipse cx="96" cy="80" rx="6" ry="2.4" fill="#7e878d" />
        <ellipse cx="124" cy="80" rx="6" ry="2.4" fill="#7e878d" />

        {/* Top rest bar */}
        <rect x="30" y="27" width="90" height="6" rx="3" fill="url(#lsBar)" stroke="#6c757b" strokeWidth="0.6" />
        <rect x="34" y="28.5" width="78" height="1.6" rx="0.8" fill="#ffffff" opacity="0.7" />

        {/* Small support cradles on the bar (where the wire rests) */}
        <circle cx="48" cy="27" r="3" fill="url(#lsChrome)" stroke="#6c757b" strokeWidth="0.5" />
        <circle cx="102" cy="27" r="3" fill="url(#lsChrome)" stroke="#6c757b" strokeWidth="0.5" />
      </svg>
    </div>
  );
}
