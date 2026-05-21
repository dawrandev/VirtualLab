"use client";

/**
 * Methylene blue reagent — modelled on the reference photo's Gram-stain
 * dropper bottles: a squat amber glass bottle with a tall coloured rubber
 * dropper teat (blue, for methylene blue), a metal/plastic collar, dark
 * liquid inside and a white "для окраски" wrap-around label with a colour tab.
 */
export function MethyleneBlueBottle() {
  return (
    <svg width="58" height="132" viewBox="0 0 58 132">
      <defs>
        <linearGradient id="mbAmber" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5a3310" />
          <stop offset="22%" stopColor="#9c6526" />
          <stop offset="50%" stopColor="#c98c3e" />
          <stop offset="78%" stopColor="#8a5620" />
          <stop offset="100%" stopColor="#4d2c0d" />
        </linearGradient>
        <linearGradient id="mbTeat" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1f2f8c" />
          <stop offset="45%" stopColor="#3f55c8" />
          <stop offset="100%" stopColor="#16236e" />
        </linearGradient>
        <linearGradient id="mbDark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#243a86" />
          <stop offset="100%" stopColor="#0c1230" />
        </linearGradient>
      </defs>

      {/* Rubber dropper teat (tall, conical, rounded tip) */}
      <path d="M25 4 Q29 0 33 4 L33 20 Q33 26 29 26 Q25 26 25 20 Z" fill="url(#mbTeat)" stroke="#10205e" strokeWidth="0.8" />
      <ellipse cx="27.5" cy="8" rx="1.4" ry="3" fill="#9fb0f0" opacity="0.6" />

      {/* Glass pipette stem peeking below the teat */}
      <rect x="27" y="26" width="4" height="14" rx="1.5" fill="#6f86e0" opacity="0.7" />

      {/* Collar / neck ring */}
      <rect x="20" y="30" width="18" height="9" rx="2" fill="#2c2c34" />
      <rect x="20" y="30" width="18" height="3" rx="1.5" fill="#4a4a55" />

      {/* Bottle body — squat with sloped shoulders */}
      <path
        d="M16 48 Q16 40 22 40 L36 40 Q42 40 42 48 L46 86 Q47 120 29 120 Q11 120 12 86 Z"
        fill="url(#mbAmber)"
        stroke="#3a2208"
        strokeWidth="1.1"
      />
      {/* Dark liquid level */}
      <path d="M13 74 L45 74 L46 86 Q47 118 29 118 Q11 118 12 86 Z" fill="url(#mbDark)" opacity="0.82" />

      {/* White wrap-around label */}
      <rect x="14" y="86" width="30" height="28" rx="1.5" fill="#f6f6f2" stroke="#cfcabd" strokeWidth="0.6" />
      <rect x="14" y="86" width="6" height="28" fill="#1f3fc4" opacity="0.9" />
      <text x="31" y="96" textAnchor="middle" fontFamily="sans-serif" fontSize="5.4" fontWeight="bold" fill="#16236e">
        Metilen
      </text>
      <text x="31" y="103" textAnchor="middle" fontFamily="sans-serif" fontSize="5.4" fontWeight="bold" fill="#16236e">
        ko‘ki
      </text>
      <text x="31" y="110" textAnchor="middle" fontFamily="sans-serif" fontSize="4" fill="#6a6a6a">
        125 ml
      </text>

      {/* Glass specular highlight */}
      <rect x="17" y="48" width="3" height="64" rx="1.5" fill="#ffffff" opacity="0.32" />
    </svg>
  );
}
