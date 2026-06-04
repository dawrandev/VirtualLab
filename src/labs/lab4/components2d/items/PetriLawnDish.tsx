"use client";

import { ANTIBIOTICS, type PlateStage } from "../../state";

interface Props {
  diameter?: number;
  stage: PlateStage;
  /** Which antibiotic disks are on the agar. */
  placedDisks?: Record<string, boolean>;
  /** Highlight one disk's zone (while measuring / examining). */
  highlight?: string | null;
  /** Show a ✓/✗ marker per classified disk. */
  classified?: Record<string, "high" | "low" | null>;
}

/** Real plate ≈ 90 mm — maps millimetres to pixels for the zones/disks. */
const PLATE_MM = 90;

/**
 * Top-down nutrient-agar plate for disk diffusion. Shows the confluent
 * bacterial lawn ("gazon"), the antibiotic paper disks, and — after incubation
 * — the clear zones of inhibition around each disk (sized by the real mm),
 * drawn as realistic glassware.
 */
export function PetriLawnDish({ diameter = 230, stage, placedDisks = {}, highlight, classified = {} }: Props) {
  const d = diameter;
  const r = d / 2;
  const mm = d / PLATE_MM; // px per mm
  const uid = `lawn-${d}`;
  const grown = stage === "grown";
  const hasLawn = stage === "lawn" || stage === "lawn-wet" || stage === "grown";

  return (
    <div style={{ position: "relative", width: d, height: d * 1.04, filter: "drop-shadow(0 7px 9px rgba(0,0,0,0.28))" }}>
      <svg width={d} height={d * 1.04} viewBox={`0 0 ${d} ${d * 1.04}`}>
        <defs>
          <radialGradient id={`ag-${uid}`} cx="42%" cy="38%" r="74%">
            <stop offset="0%" stopColor="#f3f0c0" />
            <stop offset="62%" stopColor="#e2e2a0" />
            <stop offset="100%" stopColor="#c2c97c" />
          </radialGradient>
          <radialGradient id={`gl-${uid}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#cdd8de" stopOpacity="0.4" />
          </radialGradient>
          <radialGradient id={`lawn-${uid}`} cx="48%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#eceadb" />
            <stop offset="100%" stopColor="#d8d6bf" />
          </radialGradient>
          {/* soft clip for the agar interior */}
          <clipPath id={`clip-${uid}`}>
            <circle cx={r} cy={r} r={r - 13} />
          </clipPath>
        </defs>

        {/* side wall for depth */}
        <ellipse cx={r} cy={r + d * 0.045} rx={r - 2} ry={r - 6} fill="#aab3b9" opacity="0.7" />
        {/* glass rim */}
        <circle cx={r} cy={r} r={r - 2} fill={`url(#gl-${uid})`} stroke="#8d9aa1" strokeWidth="1.4" />
        {/* agar */}
        <circle cx={r} cy={r} r={r - 13} fill={`url(#ag-${uid})`} stroke="#aeb46c" strokeWidth="1" />

        <g clipPath={`url(#clip-${uid})`}>
          {/* Confluent lawn — turbid even growth */}
          {hasLawn && <circle cx={r} cy={r} r={r - 13} fill={`url(#lawn-${uid})`} opacity={stage === "lawn-wet" ? 0.5 : 0.82} />}
          {/* faint streaks of the spread */}
          {hasLawn && (
            <g stroke="#e7e4cf" strokeWidth={d * 0.01} opacity="0.5" fill="none">
              <path d={`M ${r * 0.45} ${r * 0.7} Q ${r} ${r * 0.5} ${r * 1.55} ${r * 0.72}`} />
              <path d={`M ${r * 0.4} ${r} Q ${r} ${r * 0.82} ${r * 1.6} ${r}`} />
              <path d={`M ${r * 0.45} ${r * 1.3} Q ${r} ${r * 1.1} ${r * 1.55} ${r * 1.28}`} />
            </g>
          )}

          {/* Zones of inhibition (clear agar, no lawn) — only after incubation */}
          {grown &&
            ANTIBIOTICS.filter((a) => placedDisks[a.id]).map((a) => {
              const cx = a.fx * d;
              const cy = a.fy * d;
              const zr = (a.zoneMm * mm) / 2;
              return (
                <g key={`z-${a.id}`}>
                  <circle cx={cx} cy={cy} r={zr} fill={`url(#ag-${uid})`} />
                  <circle cx={cx} cy={cy} r={zr} fill="none" stroke={highlight === a.id ? "#0ea5a0" : "#b7bd76"} strokeWidth={highlight === a.id ? 2 : 1} strokeDasharray={highlight === a.id ? "4 3" : undefined} opacity="0.8" />
                </g>
              );
            })}
        </g>

        {/* Antibiotic paper disks on top */}
        {ANTIBIOTICS.filter((a) => placedDisks[a.id]).map((a) => {
          const cx = a.fx * d;
          const cy = a.fy * d;
          const dr = 3.2 * mm; // ~6.4 mm disk
          return (
            <g key={`d-${a.id}`}>
              <circle cx={cx} cy={cy + 1} r={dr} fill="#000" opacity="0.12" />
              <circle cx={cx} cy={cy} r={dr} fill="#fbfbf6" stroke="#cfcabd" strokeWidth="0.8" />
              <text x={cx} y={cy + dr * 0.35} textAnchor="middle" fontFamily="sans-serif" fontSize={dr * 0.8} fontWeight="bold" fill="#5b6770">
                {a.code}
              </text>
              {classified[a.id] && <circle cx={cx + dr * 1.1} cy={cy - dr * 1.1} r={dr * 0.45} fill="#10b981" />}
            </g>
          );
        })}

        {/* glass reflection */}
        <path d={`M ${r * 0.35} ${r * 0.6} Q ${r * 0.7} ${r * 0.2} ${r * 1.25} ${r * 0.42} Q ${r * 0.8} ${r * 0.5} ${r * 0.55} ${r * 0.85} Z`} fill="#ffffff" opacity="0.22" />
        <ellipse cx={r * 0.72} cy={r * 0.5} rx={r * 0.34} ry={r * 0.1} fill="#ffffff" opacity="0.3" />
      </svg>
    </div>
  );
}
