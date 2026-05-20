"use client";

/** Stack of square white filter papers, fanned slightly. Reference frame 46. */
export function FilterPaperStack() {
  return (
    <svg width="120" height="90" viewBox="0 0 120 90">
      <ellipse cx="60" cy="80" rx="56" ry="6" fill="#000" opacity="0.18" />
      <ellipse cx="60" cy="72" rx="58" ry="14" fill="#ffffff" stroke="#9aa5ad" strokeWidth="1" />
      {[...Array(5)].map((_, i) => (
        <g key={i} transform={`translate(60 60) rotate(${-8 + i * 4}) translate(-26 -16)`}>
          <rect width="52" height="34" rx="2" fill="#fafafa" stroke="#cfd6da" strokeWidth="0.6" />
          <rect x="2" y="2" width="48" height="2" fill="#e7e9eb" />
        </g>
      ))}
    </svg>
  );
}
