"use client";

/**
 * Stack of clean glass slides in an open shallow petri-style dish (reference
 * frame 46 lower-middle). Visually a glass dish with fanned overlapping
 * slides.
 */
export function SlideStack({ remaining = 3 }: { remaining?: number }) {
  return (
    <svg width="170" height="100" viewBox="0 0 170 100">
      <defs>
        <radialGradient id="stackDish" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#cfd8df" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      {/* Dish */}
      <ellipse cx="85" cy="78" rx="80" ry="14" fill="#000" opacity="0.15" />
      <ellipse cx="85" cy="70" rx="80" ry="20" fill="url(#stackDish)" stroke="#7d8a92" strokeWidth="1.2" />
      {/* Fanned slides */}
      {Array.from({ length: remaining }).map((_, i) => {
        const angle = -12 + i * 5;
        return (
          <g key={i} transform={`translate(85 64) rotate(${angle}) translate(-60 -8)`}>
            <rect width="120" height="14" rx="2" fill="#e3eff3" stroke="#6c8a96" strokeWidth="0.7" opacity="0.95" />
            <rect width="24" height="14" rx="1" fill="#f6f9fb" stroke="#6c8a96" strokeWidth="0.4" />
          </g>
        );
      })}
    </svg>
  );
}
