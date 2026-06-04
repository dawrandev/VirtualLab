"use client";

import { ANTIBIOTICS, type PlateStage, type Sens } from "../../state";

interface Props {
  diameter?: number;
  stage: PlateStage;
  /** Completed streak passes (0–3) — each one drawn in its own direction. */
  lawnPasses?: number;
  placedDisks?: Record<string, boolean>;
  highlight?: string | null;
  classified?: Record<string, Sens | null>;
}

/** Agar surface ellipse (3/4 view) — disks/zones are placed on it. */
const CX = 105;
const CY = 100;
const RX = 76;
const RY = 22;

/** Map a top-down (fx,fy) position onto the foreshortened agar ellipse. */
function onAgar(fx: number, fy: number) {
  return { x: CX + (fx - 0.5) * 2 * 70, y: CY + (fy - 0.5) * 2 * 18 };
}

/**
 * Glass Petri dish in a 3/4 (side) view — same realistic glassware as Lab 1:
 * a shallow glass dish with a visible wall, nutrient agar, a clear glass lid
 * that lifts off, and (for disk diffusion) a confluent bacterial lawn with the
 * antibiotic paper disks and their clear zones of inhibition after incubation.
 */
export function PetriLawnDish({ diameter = 230, stage, lawnPasses = 0, placedDisks = {}, highlight, classified = {} }: Props) {
  const w = diameter;
  const h = w * (164 / 210);
  const hasLawn = stage === "lawn" || stage === "lawn-wet" || stage === "grown";
  const grown = stage === "grown";
  const lidOff = hasLawn || Object.values(placedDisks).some(Boolean);
  // After incubation the whole surface is confluent; otherwise show the
  // individual directional streak passes the student has made so far.
  const passes = grown ? 3 : lawnPasses;

  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "visible", filter: "drop-shadow(0 6px 7px rgba(0,0,0,0.22))" }}>
      <svg width={w} height={h} viewBox="0 0 210 164" style={{ overflow: "visible" }}>
        <defs>
          <radialGradient id="pldAgar" cx="46%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#eef0c2" />
            <stop offset="70%" stopColor="#dfe2a4" />
            <stop offset="100%" stopColor="#c7cd82" />
          </radialGradient>
          <linearGradient id="pldWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8f1f0" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#bcd6d2" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="pldLawn" cx="46%" cy="40%" r="62%">
            <stop offset="0%" stopColor="#ecead9" />
            <stop offset="100%" stopColor="#d6d4bd" />
          </radialGradient>
          <clipPath id="pldClip">
            <ellipse cx={CX} cy={CY} rx={RX} ry={RY} />
          </clipPath>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="105" cy="150" rx="92" ry="11" fill="#000" opacity="0.13" />

        {/* Dish front wall + base */}
        <path d="M16 96 A 89 27 0 0 0 194 96 L 194 116 A 89 27 0 0 1 16 116 Z" fill="url(#pldWall)" stroke="#9bbdb8" strokeWidth="1.2" />
        <ellipse cx="105" cy="116" rx="89" ry="27" fill="#e3efed" opacity="0.5" stroke="#9bbdb8" strokeWidth="0.8" />

        {/* Agar surface */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#pldAgar)" stroke="#b7bd76" strokeWidth="1" />
        <ellipse cx="86" cy="93" rx="26" ry="7" fill="#ffffff" opacity="0.2" />

        <g clipPath="url(#pldClip)">
          {/* Confluent lawn — fills in as the passes accumulate */}
          {hasLawn && <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="url(#pldLawn)" opacity={grown ? 0.85 : 0.18 + 0.22 * passes} />}
          {/* Directional streak sets: each completed pass streaks in a new
              direction (foreshortened, so slopes stay inside the flat agar). */}
          {[0, 0.26, -0.26].map((m, p) =>
            passes > p ? (
              <g key={`pass-${p}`} stroke="#e7e4cf" strokeWidth="1.3" opacity={grown ? 0.5 : 0.66} fill="none" strokeLinecap="round">
                {[-13, -6.5, 0, 6.5, 13].map((dy) => (
                  <path key={dy} d={`M ${CX - 66} ${CY + dy - m * 66} Q ${CX} ${CY + dy - 4} ${CX + 66} ${CY + dy + m * 66}`} />
                ))}
              </g>
            ) : null,
          )}
          {/* Zones of inhibition (clear agar) after incubation */}
          {grown &&
            ANTIBIOTICS.filter((a) => placedDisks[a.id]).map((a) => {
              const { x, y } = onAgar(a.fx, a.fy);
              const zx = a.zoneMm * 0.82;
              const zy = a.zoneMm * 0.24;
              return (
                <g key={`z-${a.id}`}>
                  <ellipse cx={x} cy={y} rx={zx} ry={zy} fill="url(#pldAgar)" />
                  <ellipse cx={x} cy={y} rx={zx} ry={zy} fill="none" stroke={highlight === a.id ? "#0ea5a0" : "#b7bd76"} strokeWidth={highlight === a.id ? 1.6 : 0.8} strokeDasharray={highlight === a.id ? "3 2" : undefined} opacity="0.8" />
                </g>
              );
            })}
        </g>

        {/* Antibiotic paper disks on the surface */}
        {ANTIBIOTICS.filter((a) => placedDisks[a.id]).map((a) => {
          const { x, y } = onAgar(a.fx, a.fy);
          return (
            <g key={`d-${a.id}`}>
              <ellipse cx={x} cy={y + 1} rx="7" ry="3.2" fill="#000" opacity="0.14" />
              <ellipse cx={x} cy={y} rx="7" ry="3.2" fill="#fbfbf6" stroke="#cfcabd" strokeWidth="0.7" />
              <text x={x} y={y + 2.2} textAnchor="middle" fontFamily="sans-serif" fontSize="4.4" fontWeight="bold" fill="#5b6770">{a.code}</text>
              {classified[a.id] && <circle cx={x + 8} cy={y - 3} r="2.4" fill="#10b981" />}
            </g>
          );
        })}

        {/* Rim opening */}
        <ellipse cx="105" cy="96" rx="89" ry="27" fill="none" stroke="#a9c7bf" strokeWidth="2.4" />
        <path d="M30 86 A 89 27 0 0 1 180 86" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />

        {/* Glass lid — lifts up and aside */}
        <g style={{ transition: "transform 0.45s ease", transform: lidOff ? "translate(64px,-60px) rotate(-12deg)" : "none", transformOrigin: "105px 70px" }}>
          <path d="M16 70 A 89 27 0 0 0 194 70 L 194 64 A 89 27 0 0 1 16 64 Z" fill="#dfeeec" opacity="0.55" stroke="#a9c7bf" strokeWidth="1" />
          <ellipse cx="105" cy="64" rx="89" ry="27" fill="#eaf5f3" opacity="0.45" stroke="#a9c7bf" strokeWidth="1.6" />
          <path d="M40 56 A 89 27 0 0 1 175 58" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
