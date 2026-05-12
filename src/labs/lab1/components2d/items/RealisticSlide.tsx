"use client";

import type { StainId } from "@/engine2d/types";

interface Props {
  naclApplied: boolean;
  smeared: boolean;
  smearRotations?: number; // legacy, ignored
  dried?: boolean; // legacy, ignored
  fixPasses: number;
  stains: Record<StainId, { applied: boolean; appliedMs: number; washed: boolean }>;
  /** Rendering mode. `lateral` is the small workbench tile; `topdown` is
   *  the close-up used inside zoom cutscenes (much bigger, more detail). */
  variant?: "lateral" | "topdown";
  width?: number;
  height?: number;
}

const PALETTE: Record<StainId, { fill: string; mix: number }> = {
  cv: { fill: "#5b2e8c", mix: 0.62 },
  lugol: { fill: "#a26b1f", mix: 0.5 },
  decolor: { fill: "#e6edf1", mix: 0.18 },
  safranin: { fill: "#cc3a55", mix: 0.55 },
};

/**
 * Glass microscope slide rendered with a few realism touches:
 *   - double-line edge with a darker bottom band to imply depth
 *   - frosted label area (diagonal hatch via SVG <pattern>)
 *   - radial-gradient NaCl drop with a specular dot
 *   - swirl smear path (visible when `smeared`)
 *   - layered stain washes with edge meniscus highlight
 *
 * The `lateral` variant is small (≈120×40) and goes on the drying rack in
 * the workbench. The `topdown` variant is large (≈520×170) and is mounted
 * inside the zoom cutscenes.
 */
export function RealisticSlide({
  naclApplied,
  smeared,
  fixPasses,
  stains,
  variant = "lateral",
  width,
  height,
}: Props) {
  const w = width ?? (variant === "topdown" ? 520 : 130);
  const h = height ?? (variant === "topdown" ? 170 : 42);
  const ar = w / 100; // scale factor used inside SVG units
  const labelEnd = 22; // % of width that is the frosted label
  const fixed = fixPasses >= 3;
  const activeStain = topActiveStain(stains);

  return (
    <svg width={w} height={h} viewBox={`0 0 100 ${(h / w) * 100}`} preserveAspectRatio="xMidYMid meet">
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
        {/* per-stain wash gradient + meniscus highlight */}
        <linearGradient id={`stainWash-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.32" />
          <stop offset="20%" stopColor="white" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Glass body */}
      <rect x="0.6" y="0.6" width="98.8" height={(h / w) * 100 - 1.2} rx="2" fill={`url(#glassBody-${variant})`} stroke="#5a7d88" strokeWidth="0.6" />
      {/* Inner edge highlight */}
      <rect x="2" y="2" width="96" height={(h / w) * 100 - 4} rx="1.6" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.3" />
      {/* Bottom depth band */}
      <rect x="0.6" y={(h / w) * 100 - 2} width="98.8" height="1.4" fill="#3a5560" opacity="0.35" />

      {/* Frosted label */}
      <rect x="0.6" y="0.6" width={labelEnd} height={(h / w) * 100 - 1.2} fill={`url(#frostedHatch-${variant})`} stroke="#7d96a0" strokeWidth="0.4" />
      <rect x="0.6" y="0.6" width={labelEnd} height={(h / w) * 100 - 1.2} fill="#ffffff" opacity="0.35" />

      {/* NaCl drop (drawn before smear so it sits "under" the smear) */}
      {naclApplied && !smeared && (
        <g>
          <ellipse cx="58" cy={(h / w) * 50} rx="14" ry="4.5" fill={`url(#naclDrop-${variant})`} opacity="0.85" />
          <ellipse cx="55" cy={(h / w) * 50 - 1.2} rx="3" ry="0.8" fill="#ffffff" opacity="0.85" />
        </g>
      )}

      {/* Stain wash — full body, layered with meniscus and gradient */}
      {activeStain && (
        <>
          <rect
            x="0.6"
            y="0.6"
            width="98.8"
            height={(h / w) * 100 - 1.2}
            rx="2"
            fill={activeStain.fill}
            opacity={activeStain.mix}
          />
          <rect
            x="0.6"
            y="0.6"
            width="98.8"
            height={(h / w) * 100 - 1.2}
            rx="2"
            fill={`url(#stainWash-${variant})`}
          />
        </>
      )}

      {/* Smear swirl pattern */}
      {smeared && (
        <g opacity="0.78">
          <path
            d={`M 58 ${(h / w) * 50}
                m -10 0
                a 10 ${4 * (h / w) * 1.4} 0 1 0 20 0
                a 8 ${3 * (h / w) * 1.4} 0 1 0 -16 0
                a 6 ${2.4 * (h / w) * 1.4} 0 1 0 12 0`}
            stroke="#e7e3bd"
            strokeWidth={variant === "topdown" ? 0.7 : 1.1}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Fixation warm tint */}
      {fixed && !activeStain && (
        <rect x="0.6" y="0.6" width="98.8" height={(h / w) * 100 - 1.2} rx="2" fill="#ffe2b6" opacity="0.12" />
      )}

      {/* Top edge specular highlight */}
      <rect x="0.6" y="0.6" width="98.8" height="0.6" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

/** Picks the most recently applied non-washed stain for the wash layer.
 *  Order matters: safranin > decolor > lugol > cv. After all are washed,
 *  the dominant remaining color is used at reduced opacity for the residue. */
function topActiveStain(
  stains: Record<StainId, { applied: boolean; washed: boolean }>,
): { fill: string; mix: number } | null {
  if (stains.safranin.applied && !stains.safranin.washed) return PALETTE.safranin;
  if (stains.decolor.applied && !stains.decolor.washed) return PALETTE.decolor;
  if (stains.lugol.applied && !stains.lugol.washed) return PALETTE.lugol;
  if (stains.cv.applied && !stains.cv.washed) return PALETTE.cv;
  // Residue after washing
  if (stains.safranin.applied) return { ...PALETTE.safranin, mix: 0.32 };
  if (stains.cv.applied) return { ...PALETTE.cv, mix: 0.28 };
  return null;
}
