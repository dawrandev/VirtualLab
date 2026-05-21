"use client";

interface Props {
  enabled: boolean;
  /** Render-size multiplier (1 = 90×120). */
  scale?: number;
}

/**
 * Small lab microscope icon used as the trigger to open the microscope
 * modal. Visually shadowed/grey when disabled; full color + soft halo when
 * the slide is ready.
 */
export function MicroscopeIcon({ enabled, scale = 1 }: Props) {
  const tint = enabled ? "#1f3b6b" : "#a3afb8";
  return (
    <svg width={90 * scale} height={120 * scale} viewBox="0 0 90 120">
      <defs>
        <linearGradient id="msBody" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={enabled ? "#ffffff" : "#dfe4e8"} />
          <stop offset="100%" stopColor={enabled ? "#dbe6ea" : "#bdc6cc"} />
        </linearGradient>
      </defs>
      {/* Base */}
      <rect x="14" y="98" width="60" height="14" rx="3" fill={tint} />
      <rect x="20" y="110" width="48" height="6" rx="2" fill="#1f2933" opacity="0.5" />
      {/* Arm + stage */}
      <path d="M40 12 L40 76 L62 76 L62 90 L26 90 L26 76 L40 76" fill="url(#msBody)" stroke={tint} strokeWidth="1.5" />
      {/* Eyepiece */}
      <rect x="32" y="0" width="16" height="20" rx="2" fill={tint} />
      <circle cx="40" cy="0" r="6" fill={tint} />
      {/* Objective */}
      <rect x="36" y="70" width="8" height="14" rx="1" fill={tint} />
      {/* Slide stage */}
      <rect x="14" y="82" width="20" height="6" rx="1" fill="#e1ecf0" stroke={tint} strokeWidth="0.8" />
      {/* Knob */}
      <circle cx="68" cy="94" r="5" fill={tint} />
      {enabled && (
        <circle cx="40" cy="44" r="32" fill={tint} opacity="0.05" />
      )}
    </svg>
  );
}
