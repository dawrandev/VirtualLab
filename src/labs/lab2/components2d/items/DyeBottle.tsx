"use client";

interface Props {
  /** Rubber dropper teat colour (top + bottom for a subtle gradient). */
  teat: [string, string];
  /** Liquid colour inside (top + bottom). */
  liquid: [string, string];
  /** Glass body tint (top + bottom) — clear-ish for alcohol, amber for dyes. */
  glass?: [string, string];
  /** Label accent stripe + text colour. */
  accent: string;
  label: string[];
  ml?: string;
  id: string;
}

/**
 * Gram-stain reagent dropper bottle — a squat glass bottle with a tall coloured
 * rubber teat, metal collar, a coloured liquid level and a white wrap-around
 * label with a colour tab. Parameterised so the four Gram reagents (gentian
 * violet, Lugol, ethanol, fuchsin) share one realistic body.
 */
export function DyeBottle({ teat, liquid, glass = ["#cdd6d2", "#9fb0a8"], accent, label, ml = "100 ml", id }: Props) {
  return (
    <svg width="58" height="132" viewBox="0 0 58 132" style={{ overflow: "visible", filter: "drop-shadow(0 4px 5px rgba(0,0,0,0.25))" }}>
      <defs>
        <linearGradient id={`db-glass-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={glass[1]} />
          <stop offset="22%" stopColor={glass[0]} />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="78%" stopColor={glass[0]} />
          <stop offset="100%" stopColor={glass[1]} />
        </linearGradient>
        <linearGradient id={`db-teat-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={teat[1]} />
          <stop offset="45%" stopColor={teat[0]} />
          <stop offset="100%" stopColor={teat[1]} />
        </linearGradient>
        <linearGradient id={`db-liquid-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={liquid[0]} />
          <stop offset="100%" stopColor={liquid[1]} />
        </linearGradient>
      </defs>

      {/* Rubber dropper teat */}
      <path d={`M25 4 Q29 0 33 4 L33 20 Q33 26 29 26 Q25 26 25 20 Z`} fill={`url(#db-teat-${id})`} stroke="#00000055" strokeWidth="0.8" />
      <ellipse cx="27.5" cy="8" rx="1.4" ry="3" fill="#ffffff" opacity="0.5" />

      {/* Glass pipette stem */}
      <rect x="27" y="26" width="4" height="14" rx="1.5" fill={teat[0]} opacity="0.55" />

      {/* Collar / neck ring */}
      <rect x="20" y="30" width="18" height="9" rx="2" fill="#2c2c34" />
      <rect x="20" y="30" width="18" height="3" rx="1.5" fill="#4a4a55" />

      {/* Bottle body */}
      <path
        d="M16 48 Q16 40 22 40 L36 40 Q42 40 42 48 L46 86 Q47 120 29 120 Q11 120 12 86 Z"
        fill={`url(#db-glass-${id})`}
        stroke="#5b6b64"
        strokeWidth="1"
      />
      {/* Liquid level */}
      <path d="M13 70 L45 70 L46 86 Q47 118 29 118 Q11 118 12 86 Z" fill={`url(#db-liquid-${id})`} opacity="0.85" />

      {/* White wrap-around label */}
      <rect x="14" y="86" width="30" height="28" rx="1.5" fill="#f6f6f2" stroke="#cfcabd" strokeWidth="0.6" />
      <rect x="14" y="86" width="6" height="28" fill={accent} opacity="0.95" />
      {label.map((line, i) => (
        <text
          key={i}
          x="32"
          y={label.length > 1 ? 96 + i * 7 : 100}
          textAnchor="middle"
          fontFamily="sans-serif"
          fontSize="5.4"
          fontWeight="bold"
          fill={accent}
        >
          {line}
        </text>
      ))}
      <text x="32" y={label.length > 1 ? 96 + label.length * 7 : 108} textAnchor="middle" fontFamily="sans-serif" fontSize="4" fill="#6a6a6a">
        {ml}
      </text>

      {/* Glass specular highlights */}
      <rect x="16.5" y="46" width="4" height="64" rx="2" fill="#ffffff" opacity="0.45" />
      <ellipse cx="21" cy="48" rx="6.5" ry="3.2" fill="#ffffff" opacity="0.4" />
      <path d="M41 46 L41 110 Q41 116 35 116 Q39 114 39 108 L39 48 Z" fill="#1c2b25" opacity="0.14" />
    </svg>
  );
}

export const GentianVioletBottle = () => (
  <DyeBottle id="gv" teat={["#7c3aed", "#4c1d95"]} liquid={["#6d28d9", "#3b0a6b"]} glass={["#d8cfe8", "#b09fce"]} accent="#5b21b6" label={["Gensian-", "violet"]} />
);

export const LugolBottle = () => (
  <DyeBottle id="lg" teat={["#b45309", "#7c2d12"]} liquid={["#92500f", "#5a3208"]} glass={["#e7d3b0", "#c4a878"]} accent="#7c2d12" label={["Lyugol"]} />
);

export const EthanolBottle = () => (
  <DyeBottle id="et" teat={["#94a3b8", "#475569"]} liquid={["#eef3f8", "#cdd9e6"]} glass={["#dfe7ee", "#b8c4cf"]} accent="#334155" label={["Etil", "spirti"]} />
);

export const FuchsinBottle = () => (
  <DyeBottle id="fx" teat={["#e11d6b", "#9d174d"]} liquid={["#d4146a", "#86103f"]} glass={["#f0cfdd", "#d49fb6"]} accent="#9d174d" label={["Fuksin"]} />
);
