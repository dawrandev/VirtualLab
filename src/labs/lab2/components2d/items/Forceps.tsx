"use client";

interface Props {
  width?: number;
  /** Tips glowing red-hot just after flame sterilisation. */
  hot?: boolean;
  /** Just flamed and cooling — faint colourless heat haze, NO red tip (so it
   *  never reads as hot enough to scorch a paper disk). */
  cooling?: boolean;
}

/**
 * Stainless-steel forceps (pinset) — two springy polished arms joined at the
 * top, tapering to fine tips. Used to lift the filter paper off the smear.
 * Drawn vertically (tips at the bottom) so it reads as held in the hand.
 */
export function Forceps({ width = 40, hot, cooling }: Props) {
  const w = width;
  const h = w * (150 / 40);
  return (
    <svg width={w} height={h} viewBox="0 0 40 150" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.28))" }}>
      <defs>
        <linearGradient id="fcHot" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c8d0d6" />
          <stop offset="55%" stopColor="#e8893a" />
          <stop offset="100%" stopColor="#ff5a2c" />
        </linearGradient>
        <radialGradient id="fcGlow" cx="50%" cy="100%" r="70%">
          <stop offset="0%" stopColor="#ff8a3d" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fcSteel" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#eef2f4" />
          <stop offset="35%" stopColor="#c3ccd2" />
          <stop offset="55%" stopColor="#9aa4ab" />
          <stop offset="80%" stopColor="#c8d0d6" />
          <stop offset="100%" stopColor="#7e878d" />
        </linearGradient>
        <linearGradient id="fcSteelR" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7e878d" />
          <stop offset="20%" stopColor="#c8d0d6" />
          <stop offset="45%" stopColor="#9aa4ab" />
          <stop offset="65%" stopColor="#c3ccd2" />
          <stop offset="100%" stopColor="#eef2f4" />
        </linearGradient>
      </defs>

      {/* Joined head (spring bend) */}
      <path d="M14 6 Q20 0 26 6 L25 14 L15 14 Z" fill="url(#fcSteel)" stroke="#6c757b" strokeWidth="0.6" />

      {/* Left arm — gentle taper to a fine tip */}
      <path d="M15 12 L13 96 Q12.5 120 16 140 L18 140 Q15.5 118 16 96 L17.5 12 Z" fill="url(#fcSteel)" stroke="#6c757b" strokeWidth="0.5" />
      {/* Right arm */}
      <path d="M25 12 L27 96 Q27.5 120 24 140 L22 140 Q24.5 118 24 96 L22.5 12 Z" fill="url(#fcSteelR)" stroke="#6c757b" strokeWidth="0.5" />

      {/* Knurled grip patches */}
      <g stroke="#6c757b" strokeWidth="0.4" opacity="0.55">
        <path d="M13.6 40 L17.2 40 M13.5 44 L17.3 44 M13.4 48 L17.4 48 M13.3 52 L17.5 52" />
        <path d="M22.5 40 L26.1 40 M22.4 44 L26.2 44 M22.3 48 L26.3 48 M22.2 52 L26.4 52" />
      </g>

      {/* Bright spine highlights */}
      <path d="M16.4 14 L15 120" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
      <path d="M23.6 14 L25 120" stroke="#ffffff" strokeWidth="0.8" opacity="0.45" strokeLinecap="round" />

      {/* Hot glow halo around the tips */}
      {hot && <ellipse cx="20" cy="146" rx="16" ry="12" fill="url(#fcGlow)" />}

      {/* Cooling — colourless heat haze rising off the (steel-coloured) tips, so
          the just-flamed forceps reads as sterilised without any red-hot glow. */}
      {cooling && !hot && (
        <g opacity="0.62" stroke="#e8eef1" strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M16 134 q -2.5 -5 0 -10 q 2.5 -5 0 -10" />
          <path d="M20 137 q -2.5 -5 0 -10 q 2.5 -5 0 -10" />
          <path d="M24 134 q -2.5 -5 0 -10 q 2.5 -5 0 -10" />
        </g>
      )}

      {/* Fine tips */}
      <path d="M16 140 L17 148 L17.6 148 L18 140 Z" fill={hot ? "url(#fcHot)" : "#aeb7bd"} stroke={hot ? "#d2491f" : "#6c757b"} strokeWidth="0.4" />
      <path d="M24 140 L23 148 L22.4 148 L22 140 Z" fill={hot ? "url(#fcHot)" : "#aeb7bd"} stroke={hot ? "#d2491f" : "#6c757b"} strokeWidth="0.4" />
      {/* Lower arms tinged with heat */}
      {hot && (
        <>
          <path d="M13 120 Q12.5 130 16 140 L18 140 Q15.5 130 16 122 Z" fill="url(#fcHot)" opacity="0.8" />
          <path d="M27 120 Q27.5 130 24 140 L22 140 Q24.5 130 24 122 Z" fill="url(#fcHot)" opacity="0.8" />
        </>
      )}
    </svg>
  );
}
