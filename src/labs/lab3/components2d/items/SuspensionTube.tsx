"use client";

interface Props {
  width?: number;
  /** Lift the cotton plug out of the mouth (while the pipette draws from it). */
  plugOff?: boolean;
}

/**
 * Test tube of turbid bacterial suspension — a glass tube in a small stand-free
 * pose with a cloudy off-white liquid (the inoculum) and a cotton plug.
 */
export function SuspensionTube({ width = 56, plugOff }: Props) {
  const w = width;
  const h = w * (180 / 56);
  return (
    <svg width={w} height={h} viewBox="0 0 56 180" style={{ overflow: "visible", filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.2))" }}>
      <defs>
        <linearGradient id="suTube" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c3d6dd" stopOpacity="0.5" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a9c2cb" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="suLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e9eee6" />
          <stop offset="100%" stopColor="#cdd6c8" />
        </linearGradient>
        <radialGradient id="suCotton" cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fbf8ef" />
          <stop offset="100%" stopColor="#dcd3bc" />
        </radialGradient>
      </defs>

      {/* Tube body */}
      <path d="M14 34 L42 34 L42 150 Q42 172 28 172 Q14 172 14 150 Z" fill="url(#suTube)" stroke="#8aa2ab" strokeWidth="1.4" />
      {/* Turbid suspension */}
      <path d="M16 78 L40 78 L40 150 Q40 170 28 170 Q16 170 16 150 Z" fill="url(#suLiquid)" opacity="0.9" />
      {/* faint turbidity speckle */}
      <g fill="#bcc6b4" opacity="0.5">
        <circle cx="23" cy="100" r="1" /><circle cx="32" cy="112" r="1.1" /><circle cx="26" cy="128" r="0.9" /><circle cx="34" cy="140" r="1" /><circle cx="21" cy="120" r="0.8" />
      </g>
      {/* Specular */}
      <rect x="18" y="42" width="3" height="120" rx="1.5" fill="#ffffff" opacity="0.6" />

      {/* Cotton plug — lifts out of the mouth while sampling */}
      <g style={{ transition: "transform 0.4s ease", transform: plugOff ? "translate(16px,-30px) rotate(14deg)" : "none", transformOrigin: "28px 24px" }}>
        <path d="M11 36 Q9 18 17 10 Q22 5 28 5 Q34 5 39 10 Q47 18 45 36 Q45 42 40 42 L16 42 Q11 42 11 36 Z" fill="url(#suCotton)" stroke="#cabfa6" strokeWidth="1" />
      </g>

      {/* Red label */}
      <text x="28" y="100" fill="#d33b54" fontFamily="cursive, sans-serif" fontSize="8" fontStyle="italic" transform="rotate(90 28 100)">suspenziya</text>
    </svg>
  );
}
