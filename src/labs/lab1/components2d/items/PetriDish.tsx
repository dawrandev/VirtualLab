"use client";

interface Props {
  /** A colony shows a "touched" ring once the loop has taken a sample. */
  sampled?: boolean;
  /** Lift the glass lid off (while the loop is taking a sample). */
  lidOff?: boolean;
  width?: number;
}

/**
 * Glass Petri dish (Чашка Петри) drawn in a 3/4 (side) view to match the other
 * 3D apparatus: a shallow glass dish with a visible wall, green-yellow agar and
 * a few colonies on the foreshortened surface, plus a clear glass lid that
 * lifts off while the loop takes a sample.
 */
export function PetriDish({ sampled, lidOff, width = 210 }: Props) {
  const w = width;
  const h = w * 0.78;
  // Colonies on the (foreshortened) agar surface.
  const colonies = [
    { cx: 80, cy: 96, rx: 6, ry: 3.4, fill: "#d8c64a" },
    { cx: 132, cy: 104, rx: 5, ry: 2.8, fill: "#d8c64a" },
    { cx: 124, cy: 90, rx: 8, ry: 4.4, fill: "#9c7b46" },
    { cx: 92, cy: 110, rx: 8, ry: 4.4, fill: "#f1eede", mold: true },
    { cx: 108, cy: 113, rx: 7, ry: 3.8, fill: "#f1eede", mold: true },
  ];
  return (
    <div style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 6px 7px rgba(0,0,0,0.22))" }}>
      <svg width={w} height={h} viewBox="0 0 210 164">
        <defs>
          <radialGradient id="pdAgar" cx="46%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#eef0c2" />
            <stop offset="70%" stopColor="#dfe2a4" />
            <stop offset="100%" stopColor="#c7cd82" />
          </radialGradient>
          <linearGradient id="pdWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e8f1f0" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#bcd6d2" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id="pdMold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fbfaf2" />
            <stop offset="100%" stopColor="#d7d4c2" />
          </radialGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="105" cy="150" rx="92" ry="11" fill="#000" opacity="0.13" />

        {/* Dish front wall (between rim front arc and base front arc) */}
        <path d="M16 96 A 89 27 0 0 0 194 96 L 194 116 A 89 27 0 0 1 16 116 Z" fill="url(#pdWall)" stroke="#9bbdb8" strokeWidth="1.2" />
        {/* Base (bottom of dish) */}
        <ellipse cx="105" cy="116" rx="89" ry="27" fill="#e3efed" opacity="0.5" stroke="#9bbdb8" strokeWidth="0.8" />

        {/* Agar surface (foreshortened) */}
        <ellipse cx="105" cy="100" rx="76" ry="22" fill="url(#pdAgar)" stroke="#b7bd76" strokeWidth="1" />
        <ellipse cx="86" cy="93" rx="26" ry="7" fill="#ffffff" opacity="0.22" />

        {/* Colonies */}
        {colonies.map((c, i) => (
          <g key={i}>
            <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill={c.fill} stroke={c.mold ? "#cdcab6" : "none"} strokeWidth="0.5" />
            {sampled && i === 3 && <ellipse cx={c.cx} cy={c.cy} rx={c.rx + 3} ry={c.ry + 2} fill="none" stroke="#e0573f" strokeWidth="1.4" strokeDasharray="2 2" />}
          </g>
        ))}

        {/* Red grease-pencil label on the rim */}
        <text x="58" y="86" fill="#d2402f" fontFamily="cursive, sans-serif" fontSize="11" fontStyle="italic">227</text>

        {/* Rim opening (top edge of the dish) */}
        <ellipse cx="105" cy="96" rx="89" ry="27" fill="none" stroke="#a9c7bf" strokeWidth="2.4" />
        <path d="M30 86 A 89 27 0 0 1 180 86" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />

        {/* Glass lid — lifts up and aside while sampling */}
        <g
          style={{
            transition: "transform 0.45s ease",
            transform: lidOff ? "translate(60px,-58px) rotate(-12deg)" : "none",
            transformOrigin: "105px 70px",
          }}
        >
          <path d="M16 70 A 89 27 0 0 0 194 70 L 194 64 A 89 27 0 0 1 16 64 Z" fill="#dfeeec" opacity="0.55" stroke="#a9c7bf" strokeWidth="1" />
          <ellipse cx="105" cy="64" rx="89" ry="27" fill="#eaf5f3" opacity="0.45" stroke="#a9c7bf" strokeWidth="1.6" />
          <path d="M40 56 A 89 27 0 0 1 175 58" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
