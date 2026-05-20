"use client";

interface Props {
  /** Whether the loop has streaked the agar. Adds a faint touch mark. */
  sampled?: boolean;
  diameter?: number;
}

/**
 * Top-down agar petri dish at large size. Used inside `CultureSampleZoom`
 * — a yellow-green nutrient agar surface with a handful of bacterial
 * colonies, glass rim with subtle reflection, and an optional streak from
 * the loop tip.
 */
export function CultureDishTopDown({ sampled = false, diameter = 460 }: Props) {
  const r = diameter / 2;
  // Deterministic colony layout (no hooks here, the parent re-mounts the
  // cutscene per replay).
  const colonies = [
    [0.22, 0.31, 0.026],
    [0.71, 0.24, 0.018],
    [0.55, 0.5, 0.022],
    [0.32, 0.66, 0.03],
    [0.78, 0.61, 0.022],
    [0.45, 0.79, 0.018],
    [0.18, 0.56, 0.014],
    [0.62, 0.36, 0.02],
    [0.85, 0.48, 0.016],
    [0.37, 0.43, 0.018],
  ] as const;
  return (
    <svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
      <defs>
        <radialGradient id="dishAgar" cx="40%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#f0ee9c" />
          <stop offset="100%" stopColor="#8a9540" />
        </radialGradient>
        <radialGradient id="dishGlass" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#cdd8de" stopOpacity="0.45" />
        </radialGradient>
      </defs>
      {/* Outer glass rim */}
      <circle cx={r} cy={r} r={r - 6} fill="url(#dishGlass)" stroke="#7a868d" strokeWidth="2" />
      {/* Agar */}
      <circle cx={r} cy={r} r={r - 28} fill="url(#dishAgar)" stroke="#6f7a32" strokeWidth="1.4" />
      {/* Colonies */}
      {colonies.map(([fx, fy, fr], i) => (
        <circle
          key={i}
          cx={fx * diameter}
          cy={fy * diameter}
          r={fr * diameter}
          fill="#f7f7d2"
          stroke="#aab14c"
          strokeWidth="0.6"
        />
      ))}
      {/* Glass top highlight */}
      <ellipse cx={r - 60} cy={r - 100} rx="70" ry="14" fill="#ffffff" opacity="0.42" />
      {/* Streak from the loop after sampling */}
      {sampled && (
        <path
          d={`M ${r - 70} ${r + 20} Q ${r} ${r - 50} ${r + 80} ${r + 20}`}
          stroke="#f9f9d8"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
      )}
    </svg>
  );
}
