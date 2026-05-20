"use client";

/** Distilled water wash bottle with an angled long nozzle. */
export function WashBottle() {
  return (
    <svg width="56" height="100" viewBox="0 0 56 100">
      <defs>
        <linearGradient id="washWater" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eef7fb" />
          <stop offset="100%" stopColor="#bfe1ee" />
        </linearGradient>
      </defs>
      {/* Nozzle */}
      <path d="M30 4 L40 4 L40 18 L52 30" stroke="#3a4a52" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Cap */}
      <rect x="22" y="0" width="20" height="8" rx="1" fill="#4a5b65" />
      {/* Body */}
      <rect x="10" y="14" width="40" height="76" rx="6" fill="url(#washWater)" stroke="#3a4a52" strokeWidth="1.2" />
      {/* Label */}
      <rect x="16" y="34" width="28" height="22" rx="2" fill="#ffffff" stroke="#3a4a52" strokeWidth="0.5" />
      <text x="30" y="46" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="#1f3a4a">
        H₂O
      </text>
      <text x="30" y="54" textAnchor="middle" fontFamily="sans-serif" fontSize="5" fill="#4a5a64">
        distil.
      </text>
      <rect x="14" y="18" width="3" height="65" rx="1" fill="#ffffff" opacity="0.55" />
    </svg>
  );
}
