"use client";

import type { DropStage } from "../../state";

interface Props {
  stage: DropStage;
  /** Cleaned/degreased over the flame (faint sheen). */
  degreased?: boolean;
  /** Warming in the flame right now (degrease pass). */
  warming?: boolean;
  width?: number;
  height?: number;
}

/**
 * Microscope slide for the crushed-drop prep, top-down. Shows the run of the
 * workflow on the glass: a clear saline drop → a turbid culture suspension →
 * the cover slip lowered over it spreading the fluid into a thin square film →
 * the excess blotted so nothing runs past the cover-slip edge.
 */
export function WetMountSlide({ stage, degreased, warming, width = 150, height = 48 }: Props) {
  const w = width;
  const h = height;
  const vh = (h / w) * 100;
  const cx = 58;
  const cy = vh / 2;
  const labelEnd = 22;

  const hasSaline = stage === "saline";
  const hasMixed = stage === "mixed";
  const covered = stage === "covered" || stage === "blotted";
  const overflow = stage === "covered"; // excess not yet blotted

  // cover-slip square (in viewBox units)
  const csW = 30;
  const csH = vh - 9;
  const csX = cx - csW / 2;
  const csY = cy - csH / 2;

  return (
    <svg width={w} height={h} viewBox={`0 0 100 ${vh}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.22))" }}>
      <defs>
        <pattern id="wmFrost" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="2" stroke="#aab8bf" strokeWidth="0.4" />
        </pattern>
        <linearGradient id="wmGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbfdfe" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#e3eef3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#aac3cc" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="wmSaline" cx="48%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#cfe9f2" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#86bdd2" stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id="wmTurbid" cx="48%" cy="42%" r="58%">
          <stop offset="0%" stopColor="#eef0e6" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#d8d6bd" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#b9b896" stopOpacity="0.85" />
        </radialGradient>
        <linearGradient id="wmCover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#eef8fd" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#bcd6e0" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Glass body */}
      <rect x="0.6" y="0.6" width="98.8" height={vh - 1.2} rx="2" fill="url(#wmGlass)" stroke="#5a7d88" strokeWidth="0.6" />
      <rect x="2" y="2" width="96" height={vh - 4} rx="1.6" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.3" />
      <rect x="0.6" y={vh - 2} width="98.8" height="1.4" fill="#3a5560" opacity="0.35" />

      {/* Frosted label */}
      <rect x="0.6" y="0.6" width={labelEnd} height={vh - 1.2} fill="url(#wmFrost)" stroke="#7d96a0" strokeWidth="0.4" />
      <rect x="0.6" y="0.6" width={labelEnd} height={vh - 1.2} fill="#ffffff" opacity="0.35" />

      {/* Degreased clean sheen */}
      {degreased && !warming && <rect x="24" y="2" width="74" height={vh - 4} rx="1.6" fill="#ffffff" opacity="0.10" />}

      {/* Overflow halo (excess fluid past the cover slip, before blotting) */}
      {overflow && <rect x={csX - 5} y={csY - 3} width={csW + 10} height={csH + 6} rx="3" fill="#bfe0ec" opacity="0.32" />}

      {/* Saline drop */}
      {hasSaline && (
        <g>
          <ellipse cx={cx} cy={cy} rx="15" ry={vh * 0.32} fill="url(#wmSaline)" />
          <ellipse cx={cx - 4} cy={cy - vh * 0.12} rx="3.4" ry="1.1" fill="#ffffff" opacity="0.85" />
        </g>
      )}

      {/* Mixed culture suspension (turbid) */}
      {hasMixed && (
        <g>
          <ellipse cx={cx} cy={cy} rx="16" ry={vh * 0.34} fill="url(#wmTurbid)" />
          <g stroke="#a9a884" strokeWidth="0.5" opacity="0.5" fill="none">
            <path d={`M ${cx - 11} ${cy} q 11 -5 22 0`} />
            <path d={`M ${cx - 9} ${cy + 3} q 9 -4 18 0`} />
          </g>
        </g>
      )}

      {/* Thin fluid film under the cover slip */}
      {covered && <rect x={csX + 1} y={csY + 1} width={csW - 2} height={csH - 2} rx="1.5" fill="url(#wmTurbid)" opacity="0.5" />}

      {/* Cover slip */}
      {covered && (
        <g>
          <rect x={csX} y={csY} width={csW} height={csH} rx="1.2" fill="url(#wmCover)" stroke="#8fb0bd" strokeWidth="0.6" />
          <line x1={csX + 3} y1={csY + 2} x2={csX + csW - 6} y2={csY + csH - 4} stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
        </g>
      )}

      {/* Warming tint while passing through the flame */}
      {warming && <rect x="24" y="2" width="74" height={vh - 4} rx="1.6" fill="#ffb866" opacity="0.28" />}

      {/* Diagonal reflection + top specular */}
      <polygon points={`26,1 40,1 24,${vh - 1} 14,${vh - 1}`} fill="#ffffff" opacity="0.16" />
      <rect x="0.6" y="0.6" width="98.8" height="0.6" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}
