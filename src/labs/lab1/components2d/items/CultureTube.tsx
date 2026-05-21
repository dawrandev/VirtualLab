"use client";

interface Props {
  /** A streak appears on the slant agar once the loop has taken a sample. */
  sampled?: boolean;
  /** Lift the cotton-wool plug out of the mouth (while sampling). */
  plugOff?: boolean;
  width?: number;
}

/**
 * Bacterial culture in a glass test tube — modelled on the reference photo:
 * a long clear tube with a rounded bottom, a fluffy off-white cotton-wool plug
 * bulging out of the mouth, and a slant (скошенный) agar surface inside. A red
 * grease-pencil label sits on the glass.
 */
export function CultureTube({ sampled, plugOff, width = 70 }: Props) {
  const w = width;
  const h = w * 3.3;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <svg width={w} height={h} viewBox="0 0 70 231">
        <defs>
          <linearGradient id="ctGlass" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#c3d6dd" stopOpacity="0.5" />
            <stop offset="28%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#eaf2f5" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#a9c2cb" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="ctAgar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#efef9c" />
            <stop offset="100%" stopColor="#b3bd5a" />
          </linearGradient>
          <radialGradient id="ctCotton" cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#fbf8ef" />
            <stop offset="70%" stopColor="#ece5d4" />
            <stop offset="100%" stopColor="#d8cfb8" />
          </radialGradient>
        </defs>

        {/* Tube body (drawn first, plug overlaps the mouth) */}
        <path
          d="M19 40 L51 40 L51 196 Q51 222 35 222 Q19 222 19 196 Z"
          fill="url(#ctGlass)"
          stroke="#8aa2ab"
          strokeWidth="1.6"
        />

        {/* Slant agar inside (diagonal surface) */}
        <path
          d="M21 196 Q21 220 35 220 Q49 220 49 196 L49 138 L21 176 Z"
          fill="url(#ctAgar)"
          stroke="#9aa24a"
          strokeWidth="0.8"
        />
        <path d="M21 176 L49 138" stroke="#fcfbcf" strokeWidth="2" strokeLinecap="round" opacity="0.85" />

        {/* Streak after sampling */}
        {sampled && (
          <path d="M26 168 Q34 158 42 150" stroke="#fbfad4" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        )}

        {/* Red grease-pencil label */}
        <text x="40" y="120" fill="#d33b54" fontFamily="cursive, sans-serif" fontSize="9" fontStyle="italic" transform="rotate(90 40 120)">
          Kultura
        </text>

        {/* Glass specular highlight */}
        <rect x="23" y="48" width="3.4" height="150" rx="1.7" fill="#ffffff" opacity="0.7" />

        {/* Cotton-wool plug — fluffy, bulging out of the mouth; lifts off while sampling */}
        <g
          style={{
            transition: "transform 0.45s ease",
            transform: plugOff ? "translate(20px,-34px) rotate(16deg)" : "none",
            transformOrigin: "35px 30px",
          }}
        >
          <path
            d="M14 44 Q11 26 20 16 Q26 9 35 9 Q44 9 50 16 Q59 26 56 44 Q56 52 50 52 L20 52 Q14 52 14 44 Z"
            fill="url(#ctCotton)"
            stroke="#cabfa6"
            strokeWidth="1"
          />
          {/* Fibre texture */}
          <g stroke="#cdc3aa" strokeWidth="0.7" opacity="0.7" fill="none">
            <path d="M20 18 Q24 26 22 40" />
            <path d="M30 13 Q31 28 29 46" />
            <path d="M40 13 Q40 28 41 46" />
            <path d="M50 19 Q47 28 49 42" />
            <path d="M16 32 Q30 30 54 33" />
          </g>
          {/* Soft top highlights (wispy fluff) */}
          <ellipse cx="27" cy="16" rx="5" ry="3" fill="#fdfaf2" opacity="0.7" />
          <ellipse cx="42" cy="14" rx="6" ry="3.5" fill="#fdfaf2" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
