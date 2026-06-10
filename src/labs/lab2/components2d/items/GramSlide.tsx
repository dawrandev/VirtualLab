"use client";

import type { GramStage } from "../../state";

interface Props {
  stage: GramStage;
  /** Filter paper laid on the smear (gentian-violet step). */
  filterOn?: boolean;
  oilApplied?: boolean;
  /** Specimen Gram type — drives the retained cell colour after staining. */
  gramPositive?: boolean;
  /** 0..1 reaction progress — the dye flood deepens as the reagent develops. */
  develop?: number;
  /** No smear yet — render a clean blank slide (used by Lab 3 before smearing). */
  blank?: boolean;
  width?: number;
  height?: number;
}

/** Flood colour for each wet staining stage. */
const FLOOD: Partial<Record<GramStage, string>> = {
  violet: "#6d28d9",
  iodine: "#3f2d6e",
  fuchsin: "#d4146a",
};

/**
 * Microscope slide carrying a pre-fixed bacterial smear, rendered through the
 * Gram colour progression: violet flood → iodine darkening → decolorized →
 * fuchsin counterstain → final read (violet cells if Gram-positive, pink if
 * negative). A filter-paper sheet can sit over the smear during step 1.
 */
export function GramSlide({ stage, filterOn, oilApplied, gramPositive = true, develop = 1, blank, width = 132, height = 42 }: Props) {
  const w = width;
  const h = height;
  const vh = (h / w) * 100;
  const labelEnd = 22;
  const flood = FLOOD[stage];
  const cx = 60;
  const cyc = vh / 2;

  // Cell colour once read: Gram+ keeps violet, Gram- shows pink. Before fuchsin
  // the cells follow the wet flood; decolorized shows faint retained violet.
  const cellColor =
    stage === "final"
      ? gramPositive
        ? "#4c1d95"
        : "#c0245f"
      : stage === "decolorized"
        ? gramPositive
          ? "#5b3aa6"
          : "#9aa3ad"
        : stage === "fuchsin"
          ? "#a01050"
          : stage === "iodine"
            ? "#2c1d57"
            : stage === "violet"
              ? "#3b1d7a"
              : "#8d7f6a"; // fixed

  return (
    <svg width={w} height={h} viewBox={`0 0 100 ${vh}`} preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.22))" }}>
      <defs>
        <pattern id="gsFrost" patternUnits="userSpaceOnUse" width="2" height="2" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="2" stroke="#aab8bf" strokeWidth="0.4" />
        </pattern>
        <linearGradient id="gsGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbfdfe" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#e3eef3" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#aac3cc" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="gsFuchsinField" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#f6c9dc" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#f0b6cf" stopOpacity="0.25" />
        </radialGradient>
        <radialGradient id="gsOil" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff7df" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#f0cf7e" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#caa24a" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      {/* Glass body */}
      <rect x="0.6" y="0.6" width="98.8" height={vh - 1.2} rx="2" fill="url(#gsGlass)" stroke="#5a7d88" strokeWidth="0.6" />
      <rect x="2" y="2" width="96" height={vh - 4} rx="1.6" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.3" />

      {/* Frosted label */}
      <rect x="0.6" y="0.6" width={labelEnd} height={vh - 1.2} fill="url(#gsFrost)" stroke="#7d96a0" strokeWidth="0.4" />
      <rect x="0.6" y="0.6" width={labelEnd} height={vh - 1.2} fill="#ffffff" opacity="0.35" />

      {/* Faint pink counterstain field once fuchsin is on */}
      {(stage === "fuchsin" || stage === "final") && (
        <rect x="24" y="2" width="74" height={vh - 4} rx="2" fill="url(#gsFuchsinField)" />
      )}

      {/* The smear — clustered cocci, coloured by stage (hidden until smeared).
          Kept very faint: the unstained fixed smear is barely visible (a thin
          haze on the glass, like Lab 1's washed field); it only reads clearly
          once stained, and even then stays subtle on the bench preview. */}
      {!blank && (
        <g opacity={stage === "fixed" ? 0.16 : stage === "final" ? 0.5 : flood ? 0.5 : 0.55}>
          {COCCI.map(([dx, dy], i) => (
            <circle key={i} cx={cx + dx} cy={cyc + dy} r={1.3} fill={cellColor} />
          ))}
        </g>
      )}

      {/* Wet flood while a reagent is on the slide — deepens as it develops */}
      {flood && (
        <rect
          x="24"
          y="2"
          width="74"
          height={vh - 4}
          rx="2"
          fill={flood}
          opacity={(stage === "iodine" ? 0.5 : 0.42) + develop * 0.42}
        />
      )}

      {/* Filter paper laid over the smear — soaks up the violet dye as it develops */}
      {filterOn && (
        <g>
          <rect x="30" y="3" width="60" height={vh - 6} rx="1.5" fill="#efece1" stroke="#cfcabd" strokeWidth="0.5" opacity="0.92" />
          <rect x="30" y="3" width="60" height={vh - 6} rx="1.5" fill={flood ?? "#7c5cc4"} opacity={flood ? 0.12 + develop * 0.5 : 0.12} />
          <path d="M84 3 L90 3 L90 9 Z" fill="#ddd8c8" />
        </g>
      )}

      {/* Immersion oil bead */}
      {oilApplied && <ellipse cx={cx} cy={cyc} rx="11" ry={vh * 0.22} fill="url(#gsOil)" />}

      {/* Glass reflection */}
      <polygon points={`26,1 40,1 24,${vh - 1} 14,${vh - 1}`} fill="#ffffff" opacity="0.16" />
      <rect x="0.6" y="0.6" width="98.8" height="0.6" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}

/** Clustered cocci offsets (grape-like) around the smear centre. */
const COCCI: Array<[number, number]> = [
  [-6, -3], [-3, -4], [0, -3], [3, -4], [6, -2],
  [-7, 0], [-4, -1], [-1, 0], [2, -1], [5, 0], [8, 1],
  [-5, 3], [-2, 2], [1, 3], [4, 2], [7, 3],
  [-3, 5], [0, 5], [3, 5],
];
