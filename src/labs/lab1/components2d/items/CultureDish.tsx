"use client";

interface Props {
  /** Has the loop tip touched the agar yet? Drives a subtle disturbance. */
  sampled: boolean;
  width?: number;
}

/**
 * Bottom-left large open glass petri dish — the bacterial culture source.
 * Matches reference seg2_11/14: a wide low dish with yellow-green agar,
 * lid leaning behind, slight ground shadow. When sampled, a small streak
 * remains where the loop touched.
 */
export function CultureDish({ sampled, width = 280 }: Props) {
  const w = width;
  const h = w * 0.42;
  return (
    <div style={{ position: "relative", width: w, height: h + 14 }}>
      <svg width={w} height={h + 14} viewBox={`0 0 ${w} ${h + 14}`}>
        <defs>
          <linearGradient id="cultureAgar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e9e885" />
            <stop offset="100%" stopColor="#aab455" />
          </linearGradient>
          <linearGradient id="cultureGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f6fafc" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#c8d6dc" stopOpacity="0.65" />
          </linearGradient>
        </defs>
        {/* Ground shadow */}
        <ellipse cx={w / 2} cy={h + 6} rx={w / 2 - 8} ry="6" fill="#000" opacity="0.18" />

        {/* Leaning lid behind */}
        <g transform={`rotate(-12 ${w * 0.78} ${h * 0.4})`}>
          <ellipse
            cx={w * 0.78}
            cy={h * 0.4}
            rx={w / 2 - 14}
            ry={h / 2 - 6}
            fill="url(#cultureGlass)"
            stroke="#9eaab2"
            strokeWidth="1.2"
          />
          <ellipse cx={w * 0.78} cy={h * 0.4} rx={w / 2 - 18} ry={h / 2 - 10} fill="none" stroke="#cdd8de" strokeWidth="0.8" />
        </g>

        {/* Base — flat ellipse */}
        <ellipse cx={w / 2} cy={h / 2 + 4} rx={w / 2 - 4} ry={h / 2} fill="url(#cultureGlass)" stroke="#7d8a92" strokeWidth="1.4" />
        {/* Agar inside */}
        <ellipse cx={w / 2} cy={h / 2 + 4} rx={w / 2 - 12} ry={h / 2 - 6} fill="url(#cultureAgar)" stroke="#7e8835" strokeWidth="0.8" />

        {/* Agar highlight (specular) */}
        <ellipse cx={w / 2 - 30} cy={h / 2 - 8} rx="40" ry="6" fill="#ffffff" opacity="0.45" />

        {/* Streak after sampling */}
        {sampled && (
          <path
            d={`M ${w * 0.3} ${h * 0.55} Q ${w * 0.5} ${h * 0.35} ${w * 0.7} ${h * 0.55}`}
            stroke="#f9f9d8"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Outer rim shine */}
        <ellipse cx={w / 2} cy={h / 2 + 1} rx={w / 2 - 6} ry="3" fill="#ffffff" opacity="0.35" />
      </svg>
    </div>
  );
}
