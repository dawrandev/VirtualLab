"use client";

interface Props {
  /** Has the loop already taken sample from this dish? */
  sampled: boolean;
  /** Title displayed below (e.g., "Kultura"). */
  label?: string;
  size?: number;
}

/**
 * Top-down petri dish view used as the sample colony source. Yellow-green
 * agar surface with off-white bacterial colonies. Lid is slightly offset
 * to imply it's "open". Reference frame 30, 36.
 */
export function PetriDish({ sampled, label, size = 140 }: Props) {
  const r = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size + (label ? 18 : 0) }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="agar" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#e8e88c" />
            <stop offset="100%" stopColor="#a8b048" />
          </radialGradient>
        </defs>
        {/* Glass rim shadow */}
        <ellipse cx={r} cy={r + 3} rx={r - 4} ry={r / 2.4} fill="#000" opacity="0.18" />
        {/* Outer rim */}
        <circle cx={r} cy={r} r={r - 4} fill="#f4f7fa" stroke="#9eaab2" strokeWidth="1.5" opacity="0.6" />
        {/* Agar surface */}
        <circle cx={r} cy={r} r={r - 12} fill="url(#agar)" stroke="#7a8438" strokeWidth="1" />
        {/* Colonies */}
        {!sampled &&
          [
            [0.2, 0.3, 6],
            [0.7, 0.25, 4],
            [0.55, 0.5, 5],
            [0.3, 0.65, 7],
            [0.78, 0.62, 5],
            [0.45, 0.78, 4],
            [0.18, 0.55, 3],
          ].map(([fx, fy, rad], i) => (
            <circle
              key={i}
              cx={fx * size}
              cy={fy * size}
              r={rad}
              fill="#f9f9d8"
              stroke="#9aa242"
              strokeWidth="0.5"
            />
          ))}
        {sampled && (
          <path
            d={`M${size * 0.25} ${size * 0.65} Q${size * 0.5} ${size * 0.4} ${size * 0.7} ${size * 0.6}`}
            stroke="#f9f9d8"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Top highlight */}
        <ellipse cx={r - 12} cy={r - 22} rx="20" ry="6" fill="#ffffff" opacity="0.35" />
      </svg>
      {label && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{ bottom: 0, fontSize: 11, fontWeight: 600, color: "#475569" }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
