"use client";

interface Props {
  /** 0..1 — fraction of the wait elapsed (sand drained from top to bottom). */
  progress: number;
  width?: number;
}

/**
 * Sand hourglass (qum soat) for the staining wait. The top chamber drains and
 * the bottom heap grows as `progress` goes 0 → 1, with a thin falling stream in
 * the neck while it runs. Purely a visual time cue — the real timing is driven
 * by the workbench. The funnel shapes are produced by clipping the sand rects
 * to the glass outline, so the sand always reads as triangular wedges.
 */
export function Hourglass({ progress, width = 30 }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  const w = width;
  const h = w * (56 / 44);
  const done = p >= 1;

  return (
    <svg width={w} height={h} viewBox="0 0 44 56" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="hgGlass">
          <polygon points="10,8 34,8 22,28" />
          <polygon points="22,28 34,48 10,48" />
        </clipPath>
        <linearGradient id="hgSand" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Wooden caps + side posts */}
      <rect x="5" y="1.5" width="34" height="5" rx="2.2" fill="#caa46a" stroke="#a07c44" strokeWidth="0.6" />
      <rect x="5" y="49.5" width="34" height="5" rx="2.2" fill="#caa46a" stroke="#a07c44" strokeWidth="0.6" />
      <rect x="7.5" y="5.5" width="2.4" height="45" rx="1.2" fill="#b8915a" opacity="0.85" />
      <rect x="34.1" y="5.5" width="2.4" height="45" rx="1.2" fill="#b8915a" opacity="0.85" />

      {/* Glass body tint */}
      <g clipPath="url(#hgGlass)">
        <rect x="8" y="6" width="28" height="44" fill="#eaf2f5" opacity="0.45" />

        {/* Top chamber sand — drains downward */}
        <rect x="8" y={8 + 20 * p} width="28" height={Math.max(0, 28 - (8 + 20 * p))} fill="url(#hgSand)" />
        {/* Bottom heap — grows */}
        <rect x="8" y={48 - 20 * p} width="28" height={20 * p} fill="url(#hgSand)" />
        {/* Falling stream */}
        {!done && p > 0 && <rect x="21.2" y="27" width="1.6" height="21" fill="#f59e0b" opacity="0.9" />}
        {/* tiny pile bounce at the neck */}
        {!done && p > 0 && <ellipse cx="22" cy={47 - 19 * p} rx={3 + 4 * p} ry="1.6" fill="#fbbf24" opacity="0.8" />}
      </g>

      {/* Glass outline */}
      <polygon points="10,8 34,8 22,28" fill="none" stroke="#9bb8c2" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points="22,28 34,48 10,48" fill="none" stroke="#9bb8c2" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="20.5" y="26" width="3" height="4" fill="#cfe0e6" opacity="0.7" />
      {/* glass shine */}
      <line x1="14" y1="11" x2="19" y2="22" stroke="#ffffff" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
    </svg>
  );
}
