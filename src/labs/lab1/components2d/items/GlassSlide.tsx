"use client";

import type { StainId } from "@/engine2d/types";

interface Props {
  naclApplied: boolean;
  smeared: boolean;
  /** Kept for backward compat. Treat any non-zero as "smeared". */
  smearRotations?: number;
  /** Kept for backward compat. Treated as always-true once smeared in current flow. */
  dried?: boolean;
  fixPasses: number;
  stains: Record<StainId, { applied: boolean; appliedMs: number; washed: boolean }>;
  width?: number;
  height?: number;
}

/**
 * Rectangular glass microscope slide. Visual state composes layers:
 *   - empty glass (transparent + thin frosted edge)
 *   - NaCl droplet (light-blue oval)
 *   - smear (off-white spiral, intensity scales with smearRotations)
 *   - fixation glow (faint warm tint when fixed)
 *   - stain layer (whichever stain is most-recently applied & not washed-off)
 */
export function GlassSlide({
  naclApplied,
  smeared,
  smearRotations = 0,
  dried = true,
  fixPasses,
  stains,
  width = 110,
  height = 36,
}: Props) {
  const fixed = fixPasses >= 3;
  const stainColor = getActiveStainColor(stains);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="slideGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#dbeef4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#a4c7d2" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* Glass body */}
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="2" fill="url(#slideGlass)" stroke="#6890a0" strokeWidth="1" />
      {/* Frosted label end */}
      <rect x="2" y="2" width="22" height={height - 4} fill="#f6f9fb" stroke="#6890a0" strokeWidth="0.6" opacity="0.85" />

      {/* NaCl droplet */}
      {naclApplied && !smeared && (
        <ellipse cx={width * 0.55} cy={height / 2} rx="11" ry="6" fill="#cce4ef" stroke="#69b5ce" strokeWidth="0.8" opacity="0.85" />
      )}

      {/* Smear spiral */}
      {smeared && (
        <g opacity={Math.min(1, 0.4 + 0.2 * smearRotations)}>
          <path
            d={`M ${width * 0.5} ${height / 2 - 6} a 8,6 0 1,0 0.001 0 M ${width * 0.5 - 3} ${height / 2 - 4} a 6,4 0 1,0 0.001 0`}
            stroke="#e8e4c0"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Drying warm tint */}
      {(dried || fixed) && smeared && (
        <rect x="2" y="2" width={width - 4} height={height - 4} rx="2" fill="#ffead0" opacity={fixed ? 0.18 : 0.1} />
      )}

      {/* Active stain wash */}
      {smeared && stainColor && (
        <rect x="2" y="2" width={width - 4} height={height - 4} rx="2" fill={stainColor.fill} opacity={stainColor.opacity} />
      )}

      {/* Edge highlight */}
      <rect x="2" y="2" width={width - 4} height="1.5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}

function getActiveStainColor(
  stains: Record<StainId, { applied: boolean; washed: boolean }>,
): { fill: string; opacity: number } | null {
  // priority based on Gram-stain order (safranin overrides if applied)
  if (stains.safranin.applied && !stains.safranin.washed) return { fill: "#cc3a55", opacity: 0.55 };
  if (stains.safranin.applied) return { fill: "#cc3a55", opacity: 0.35 };
  if (stains.cv.applied && !stains.cv.washed) return { fill: "#5b2e8c", opacity: 0.6 };
  if (stains.lugol.applied && !stains.lugol.washed) return { fill: "#a26b1f", opacity: 0.4 };
  if (stains.cv.applied) return { fill: "#5b2e8c", opacity: 0.45 };
  if (stains.decolor.applied) return { fill: "#ffffff", opacity: 0.05 };
  return null;
}
