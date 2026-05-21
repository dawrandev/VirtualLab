"use client";

interface Props {
  naclApplied: boolean;
  smeared: boolean;
  smearRotations?: number; // legacy, ignored
  /** Matte (air-dried) vs glossy wet drop. */
  dried?: boolean;
  fixPasses: number;
  /** Methylene blue stain layer. */
  mb: { applied: boolean; washed: boolean };
  /** Oil bead at the center for the 100× objective. */
  oilApplied?: boolean;
  /** Rendering mode. `lateral` is the small workbench tile; `topdown` is the
   *  close-up used inside zoom cutscenes (much bigger, more detail). */
  variant?: "lateral" | "topdown";
  width?: number;
  height?: number;
}

/**
 * Glass microscope slide with the same realism touches as before (frosted
 * label, glass body, NaCl drop, smear swirl) — but the stain is now a single
 * methylene-blue layer: a deep blue flood while applied, fading to a pale-blue
 * stained field once washed.
 */
export function RealisticSlide({
  naclApplied,
  smeared,
  dried,
  fixPasses,
  mb,
  oilApplied,
  variant = "lateral",
  width,
  height,
}: Props) {
  const w = width ?? (variant === "topdown" ? 520 : 130);
  const h = height ?? (variant === "topdown" ? 170 : 42);
  const labelEnd = 22; // % of width that is the frosted label
  const fixed = fixPasses >= 3;
  const vh = (h / w) * 100;

  return (
    <svg width={w} height={h} viewBox={`0 0 100 ${vh}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.22))" }}>
      <defs>
        <pattern id={`frostedHatch-${variant}`} patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="2" stroke="#aab8bf" strokeWidth="0.4" />
        </pattern>
        <linearGradient id={`glassBody-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbfdfe" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#e3eef3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#aac3cc" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={`naclDrop-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="55%" stopColor="#b4dceb" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#5b9bb6" stopOpacity="0.85" />
        </radialGradient>
        <radialGradient id={`mbWet-${variant}`} cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#3f63e8" />
          <stop offset="100%" stopColor="#16267e" />
        </radialGradient>
        <radialGradient id={`oilBead-${variant}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7df" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f0cf7e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#caa24a" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Glass body */}
      <rect x="0.6" y="0.6" width="98.8" height={vh - 1.2} rx="2" fill={`url(#glassBody-${variant})`} stroke="#5a7d88" strokeWidth="0.6" />
      {/* Inner edge highlight */}
      <rect x="2" y="2" width="96" height={vh - 4} rx="1.6" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.3" />
      {/* Bottom depth band */}
      <rect x="0.6" y={vh - 2} width="98.8" height="1.4" fill="#3a5560" opacity="0.35" />

      {/* Frosted label */}
      <rect x="0.6" y="0.6" width={labelEnd} height={vh - 1.2} fill={`url(#frostedHatch-${variant})`} stroke="#7d96a0" strokeWidth="0.4" />
      <rect x="0.6" y="0.6" width={labelEnd} height={vh - 1.2} fill="#ffffff" opacity="0.35" />

      {/* NaCl drop (drawn before smear so it sits "under" the smear) */}
      {naclApplied && !smeared && (
        <g>
          <ellipse cx="58" cy={vh / 2} rx="14" ry="4.5" fill={`url(#naclDrop-${variant})`} opacity={dried ? 0.4 : 0.85} />
          {!dried && <ellipse cx="55" cy={vh / 2 - 1.2} rx="3" ry="0.8" fill="#ffffff" opacity="0.85" />}
        </g>
      )}

      {/* Methylene-blue flood (applied, not yet washed) — fades in slowly */}
      {mb.applied && !mb.washed && (
        <rect
          x="0.6"
          y="0.6"
          width="98.8"
          height={vh - 1.2}
          rx="2"
          fill={`url(#mbWet-${variant})`}
          opacity="0.9"
          style={{ animation: "wbMbFade 1.7s ease-out" }}
        />
      )}

      {/* Washed pale-blue stained field */}
      {mb.washed && (
        <>
          <rect x="24" y="2" width="74" height={vh - 4} rx="2" fill="#b9c9f2" opacity="0.5" />
          <ellipse cx="58" cy={vh / 2} rx="26" ry={vh * 0.32} fill="#7d97e6" opacity="0.45" />
        </>
      )}

      {/* Smear swirl pattern */}
      {smeared && (
        <g opacity={mb.applied && !mb.washed ? 0.35 : 0.78}>
          <path
            d={`M 58 ${vh / 2}
                m -10 0
                a 10 ${4 * (vh / 100) * 1.4} 0 1 0 20 0
                a 8 ${3 * (vh / 100) * 1.4} 0 1 0 -16 0
                a 6 ${2.4 * (vh / 100) * 1.4} 0 1 0 12 0`}
            stroke={mb.washed ? "#2a3f9e" : "#e7e3bd"}
            strokeWidth={variant === "topdown" ? 0.7 : 1.1}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Fixation warm tint (only visible pre-stain) */}
      {fixed && !mb.applied && (
        <rect x="0.6" y="0.6" width="98.8" height={vh - 1.2} rx="2" fill="#ffe2b6" opacity="0.12" />
      )}

      {/* Immersion oil bead */}
      {oilApplied && <ellipse cx="58" cy={vh / 2} rx="11" ry={vh * 0.22} fill={`url(#oilBead-${variant})`} />}

      {/* Diagonal glass reflection sweep */}
      <polygon points={`26,1 40,1 24,${vh - 1} 14,${vh - 1}`} fill="#ffffff" opacity="0.16" />
      {/* Top edge specular highlight */}
      <rect x="0.6" y="0.6" width="98.8" height="0.6" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}
