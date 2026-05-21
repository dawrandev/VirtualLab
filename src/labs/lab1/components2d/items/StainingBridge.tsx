"use client";

interface Props {
  width?: number;
}

/**
 * Glass staining bridge (мостик для окраски) in a VERTICAL orientation: two
 * parallel glass rails running top→bottom with pink-tinted arched handles at
 * each end. It lays across the (horizontal) kidney tray; the smear slide rests
 * horizontally across the two rails and excess dye/water runs off into the tray.
 */
export function StainingBridge({ width = 150 }: Props) {
  const w = width;
  const h = w * 1.6;
  return (
    <div style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.25))" }}>
      <svg width={w} height={h} viewBox="0 0 150 240">
        <defs>
          <linearGradient id="sbRail" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f4fbff" />
            <stop offset="45%" stopColor="#d4e6ef" />
            <stop offset="100%" stopColor="#a4c0cf" />
          </linearGradient>
          <linearGradient id="sbPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3cdee" />
            <stop offset="55%" stopColor="#d3a3e0" />
            <stop offset="100%" stopColor="#b07fd0" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="75" cy="230" rx="58" ry="7" fill="#000" opacity="0.12" />

        {/* Top arched handle (connects the two rail tops) */}
        <path d="M48 46 C48 18 102 18 102 46" fill="none" stroke="url(#sbPink)" strokeWidth="9" strokeLinecap="round" />
        <path d="M50 46 C50 24 100 24 100 46" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

        {/* Bottom arched handle */}
        <path d="M48 196 C48 224 102 224 102 196" fill="none" stroke="url(#sbPink)" strokeWidth="9" strokeLinecap="round" />
        <path d="M50 196 C50 218 100 218 100 196" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />

        {/* Left rail (vertical) */}
        <rect x="43.5" y="44" width="9" height="154" rx="4.5" fill="url(#sbRail)" stroke="#8aa6b4" strokeWidth="0.6" />
        <rect x="45" y="50" width="2" height="142" rx="1" fill="#ffffff" opacity="0.8" />

        {/* Right rail (vertical) */}
        <rect x="97.5" y="44" width="9" height="154" rx="4.5" fill="url(#sbRail)" stroke="#8aa6b4" strokeWidth="0.6" />
        <rect x="99" y="50" width="2" height="142" rx="1" fill="#ffffff" opacity="0.8" />
      </svg>
    </div>
  );
}
