"use client";

interface Props {
  width?: number;
  /** Dye runoff pooled in the basin (after washing). */
  stained?: boolean;
  /** Pooled dye colour: [pool fill, deep centre, streak, streak2].
   *  Defaults to methylene blue (Lab 1). Lab 2 passes violet / pink. */
  stainColors?: [string, string, string, string];
}

/**
 * Medical kidney tray (лоток почкообразный) — white enamel with a thin dark
 * rim, modelled on the real reference photo. Realistic, restrained shading:
 * a soft white basin gradient, a diffuse (blurred) enamel sheen, a soft far-wall
 * shadow and a thin glossy near rim — no flat fills, no thick cartoon outline.
 */
export function KidneyTray({ width = 330, stained, stainColors = ["#3a57c8", "#22379e", "#1b2e86", "#2c46b0"] }: Props) {
  const w = width;
  const h = w * (210 / 300);
  // Reniform outline: wider rounded left lobe, narrower right, concave top.
  const kidney =
    "M44 112 C40 72 84 54 126 68 C150 76 162 76 184 67 C224 52 264 70 258 114 C252 152 210 167 166 163 C116 158 50 154 46 120 C44.5 117 44 114.5 44 112 Z";

  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <svg width={w} height={h} viewBox="0 0 300 210">
        <defs>
          <filter id="ktDrop" x="-25%" y="-25%" width="150%" height="170%">
            <feDropShadow dx="0" dy="7" stdDeviation="9" floodColor="#000000" floodOpacity="0.26" />
          </filter>
          <filter id="ktBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <linearGradient id="ktBasin2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#dde2e7" />
            <stop offset="34%" stopColor="#fbfcfd" />
            <stop offset="78%" stopColor="#f1f3f5" />
            <stop offset="100%" stopColor="#e3e7ea" />
          </linearGradient>
          <radialGradient id="ktSheen2" cx="40%" cy="34%" r="46%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ktRim2b" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3c3d46" />
            <stop offset="100%" stopColor="#15151b" />
          </linearGradient>
        </defs>

        <g filter="url(#ktDrop)">
          {/* Thin outer wall (slight depth under the rim) */}
          <path d={kidney} transform="translate(0,6)" fill="#cdd2d6" opacity="0.9" />
          {/* Enamel basin */}
          <path d={kidney} fill="url(#ktBasin2)" />
          {/* Soft far-wall shadow (back inner edge) */}
          <path
            d="M58 96 C96 72 150 70 196 84 C156 80 104 84 70 104 Z"
            fill="#c3c9ce"
            opacity="0.5"
            filter="url(#ktBlur)"
          />
          {/* Diffuse enamel sheen */}
          <ellipse cx="120" cy="96" rx="74" ry="30" fill="url(#ktSheen2)" filter="url(#ktBlur)" />
          {/* Methylene-blue runoff pooled in the basin (after washing) */}
          {stained && (
            <>
              <path d={kidney} fill={stainColors[0]} opacity="0.2" />
              <ellipse cx="150" cy="132" rx="92" ry="30" fill={stainColors[1]} opacity="0.34" filter="url(#ktBlur)" />
              <path d="M70 128 Q150 150 232 126" stroke={stainColors[2]} strokeWidth="6" fill="none" opacity="0.3" strokeLinecap="round" />
              <path d="M96 138 Q150 124 208 140" stroke={stainColors[3]} strokeWidth="4" fill="none" opacity="0.28" strokeLinecap="round" />
            </>
          )}
          {/* Thin dark enamel rim */}
          <path d={kidney} fill="none" stroke="url(#ktRim2b)" strokeWidth="2.6" />
          {/* Bright near-rim highlight (lower edge gloss) */}
          <path d="M70 150 C110 162 200 160 244 138" fill="none" stroke="#ffffff" strokeWidth="1.6" opacity="0.45" />
        </g>
      </svg>
    </div>
  );
}
