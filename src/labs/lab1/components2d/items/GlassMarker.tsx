"use client";

/** Стеклограф — short label pill with marker pen. Decorative; not interactive in this lab. */
export function GlassMarker() {
  return (
    <div style={{ position: "relative", width: 170, height: 50 }}>
      <svg width="170" height="50" viewBox="0 0 170 50" style={{ position: "absolute", inset: 0 }}>
        <rect x="8" y="20" width="140" height="20" rx="10" fill="#1f3b6b" />
        <rect x="14" y="24" width="130" height="6" rx="3" fill="#3a5996" />
        <text x="80" y="34" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fontWeight="bold" fill="#ffffff">
          Steklograf
        </text>
        {/* Pen body */}
        <rect x="148" y="14" width="14" height="32" rx="2" fill="#222" />
        <rect x="148" y="14" width="14" height="4" rx="2" fill="#dad7c5" />
      </svg>
    </div>
  );
}
