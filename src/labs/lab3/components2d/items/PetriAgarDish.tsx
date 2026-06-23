"use client";

import type { Growth } from "../../state";

interface Props {
  diameter?: number;
  /** A drop of suspension placed on the agar (before spreading). */
  material?: boolean;
  /** Spread streaks raked across the surface by the spreader. */
  spread?: boolean;
  /** Growth pattern after incubation. */
  growth?: Growth;
  /** Plate number badge (1 / 2 / 3). */
  label?: string;
  /** Highlight as the active sampling target (isolated colony in plate 3). */
  pickTarget?: boolean;
}

/** Deterministic colony scatter inside the agar radius (fractions of diameter).
 *  Colony SIZE grows plate 1 → 3 (more nutrients per cell as the inoculum thins):
 *  plate 1 = a confluent mat of tiny colonies packed so tight they touch; plate 2
 *  = medium, partly merged; plate 3 = a few large, well-separated isolated ones. */
const LAWN = makeScatter(320, 0.40, 0.017, 0.0008);
const MERGED = makeScatter(34, 0.34, 0.020, 0.003);
const ISOLATED: Array<[number, number, number]> = [
  [0.34, 0.36, 0.044], [0.62, 0.3, 0.038], [0.7, 0.58, 0.042], [0.4, 0.64, 0.040],
  [0.52, 0.48, 0.036], [0.28, 0.54, 0.034], [0.66, 0.44, 0.033], [0.46, 0.26, 0.031],
  [0.58, 0.68, 0.039], [0.36, 0.46, 0.032],
];

function makeScatter(n: number, spreadR: number, rBase: number, rStep: number): Array<[number, number, number]> {
  const pts: Array<[number, number, number]> = [];
  const ga = 2.399963;
  for (let i = 0; i < n; i++) {
    const r = spreadR * Math.sqrt(i / n);
    const a = i * ga;
    pts.push([0.5 + r * Math.cos(a), 0.5 + r * Math.sin(a), rBase + (i % 4) * rStep]);
  }
  return pts;
}

/**
 * Top-down nutrient-agar Petri plate, drawn as real glassware: a thick bevelled
 * glass rim with depth, the agar set below the rim with a meniscus ring, a
 * curved glass-lid reflection sweep and a soft drop shadow. After incubation it
 * shows the three classic Drigalski outcomes (confluent lawn / merged / isolated).
 */
export function PetriAgarDish({ diameter = 150, material, spread, growth = "none", label, pickTarget }: Props) {
  const d = diameter;
  const r = d / 2;
  const uid = `${d}-${label ?? "x"}`;
  const colonies = growth === "lawn" ? LAWN : growth === "merged" ? MERGED : growth === "isolated" ? ISOLATED : [];

  return (
    <div style={{ position: "relative", width: d, height: d * 1.06, filter: "drop-shadow(0 7px 9px rgba(0,0,0,0.28))" }}>
      <svg width={d} height={d * 1.06} viewBox={`0 0 ${d} ${d * 1.06}`}>
        <defs>
          <radialGradient id={`agar-${uid}`} cx="42%" cy="38%" r="74%">
            <stop offset="0%" stopColor="#f4f1c4" />
            <stop offset="62%" stopColor="#e4e4a2" />
            <stop offset="100%" stopColor="#c2c97c" />
          </radialGradient>
          <radialGradient id={`menis-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="82%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#8a8a48" stopOpacity="0.4" />
          </radialGradient>
          <radialGradient id={`rim-${uid}`} cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#fdfefe" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#dbe6ea" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9fb0b8" stopOpacity="0.55" />
          </radialGradient>
          <linearGradient id={`wall-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c2ced4" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#8a979e" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Side wall (gives the dish vertical depth) */}
        <ellipse cx={r} cy={r + d * 0.05} rx={r - 2} ry={r - 6} fill={`url(#wall-${uid})`} />

        {/* Outer glass rim disc */}
        <circle cx={r} cy={r} r={r - 2} fill={`url(#rim-${uid})`} stroke="#8d9aa1" strokeWidth="1.4" />
        <circle cx={r} cy={r} r={r - 2} fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />

        {/* Agar set down inside the rim */}
        <circle cx={r} cy={r} r={r - 14} fill={`url(#agar-${uid})`} stroke="#aeb46c" strokeWidth="1" />
        {/* Agar meniscus (dark ring where it meets the glass wall) */}
        <circle cx={r} cy={r} r={r - 14} fill={`url(#menis-${uid})`} />

        {/* Confluent lawn = cloudy wash over the agar */}
        {growth === "lawn" && <circle cx={r} cy={r} r={r - 18} fill="#f6f4d6" opacity="0.6" />}

        {/* Spreader streaks */}
        {spread && (
          <g stroke={growth === "none" ? "#cfcf9a" : "#eceaca"} strokeWidth={d * 0.016} fill="none" strokeLinecap="round" opacity="0.65">
            <path d={`M ${r * 0.55} ${r * 0.72} Q ${r} ${r * 0.48} ${r * 1.45} ${r * 0.74}`} />
            <path d={`M ${r * 0.5} ${r} Q ${r} ${r * 0.8} ${r * 1.5} ${r}`} />
            <path d={`M ${r * 0.55} ${r * 1.28} Q ${r} ${r * 1.06} ${r * 1.45} ${r * 1.26}`} />
          </g>
        )}

        {/* Suspension drop */}
        {material && !spread && <circle cx={r} cy={r} r={d * 0.06} fill="#cfe0d6" opacity="0.7" />}

        {/* Colonies — each with a tiny highlight for a 3D bead look */}
        {colonies.map(([fx, fy, fr], i) => (
          <g key={i}>
            <circle cx={fx * d} cy={fy * d} r={fr * d} fill="#f8f8da" stroke="#b3b85a" strokeWidth="0.5" opacity={growth === "lawn" ? 0.85 : 1} />
            {growth !== "lawn" && <circle cx={fx * d - fr * d * 0.3} cy={fy * d - fr * d * 0.3} r={fr * d * 0.4} fill="#ffffff" opacity="0.6" />}
          </g>
        ))}

        {/* Pick-target ring on an isolated colony */}
        {pickTarget && growth === "isolated" && (
          <circle cx={0.34 * d} cy={0.36 * d} r={0.055 * d} fill="none" stroke="#e0573f" strokeWidth="1.6" strokeDasharray="3 2" />
        )}

        {/* Glass-lid reflection sweep */}
        <path d={`M ${r * 0.35} ${r * 0.6} Q ${r * 0.7} ${r * 0.2} ${r * 1.25} ${r * 0.42} Q ${r * 0.8} ${r * 0.5} ${r * 0.55} ${r * 0.85} Z`} fill="#ffffff" opacity="0.28" />
        <ellipse cx={r * 0.72} cy={r * 0.5} rx={r * 0.34} ry={r * 0.1} fill="#ffffff" opacity="0.35" />

        {/* Plate number on the rim */}
        {label && (
          <text x={r} y={d + d * 0.005} textAnchor="middle" fontFamily="sans-serif" fontSize={d * 0.1} fontWeight="bold" fill="#c0392b" opacity="0.9">
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
