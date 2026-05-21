"use client";

interface Props {
  /** Darkens the corner that has absorbed liquid after blotting. */
  wet?: boolean;
}

/**
 * Bibulous / filter paper — a soft white rectangular sheet with a faint
 * fibrous grid texture and slightly irregular, dog-eared corner. When `wet`
 * a damp patch darkens where it touched the slide.
 */
export function FilterPaper({ wet }: Props) {
  return (
    <svg width="84" height="100" viewBox="0 0 84 100">
      <defs>
        <linearGradient id="fpBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eceae2" />
        </linearGradient>
        <pattern id="fpFibers" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 0 H6 M0 0 V6" stroke="#d8d5c8" strokeWidth="0.4" />
        </pattern>
        <radialGradient id="fpWet" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#9fb7c4" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#9fb7c4" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Drop shadow */}
      <rect x="10" y="10" width="66" height="84" rx="3" fill="#000" opacity="0.12" />

      {/* Sheet body */}
      <path
        d="M7 5 L71 5 L71 79 L60 90 L7 90 Z"
        fill="url(#fpBody)"
        stroke="#cfccc0"
        strokeWidth="1"
      />
      {/* Fiber texture */}
      <path d="M7 5 L71 5 L71 79 L60 90 L7 90 Z" fill="url(#fpFibers)" opacity="0.7" />

      {/* Folded corner */}
      <path d="M60 90 L71 79 L60 79 Z" fill="#dedbce" stroke="#cfccc0" strokeWidth="0.8" />

      {/* Damp patch after blotting */}
      {wet && <ellipse cx="40" cy="55" rx="20" ry="22" fill="url(#fpWet)" />}

      {/* Subtle top highlight */}
      <rect x="10" y="8" width="58" height="3" rx="1.5" fill="#ffffff" opacity="0.8" />
    </svg>
  );
}
