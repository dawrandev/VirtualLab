"use client";

interface Props {
  width?: number;
}

/**
 * Cover slip (покровное стекло) — a very thin, almost-square piece of glass
 * lowered onto the drop. Drawn in a slight 3/4 so the thin glass edge reads,
 * with a faint blue-grey tint, a diagonal sheen and a bright corner glint.
 */
export function CoverSlip({ width = 72 }: Props) {
  const w = width;
  const h = w * (62 / 72);
  return (
    <svg width={w} height={h} viewBox="0 0 72 62" style={{ overflow: "visible", filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.2))" }}>
      <defs>
        <linearGradient id="csTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f2fafe" stopOpacity="0.92" />
          <stop offset="45%" stopColor="#dcebf2" stopOpacity="0.72" />
          <stop offset="100%" stopColor="#b9d2dd" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* thin glass edge (extruded down a few px) */}
      <path d="M8 14 L60 8 L66 44 L14 50 Z" fill="#9db8c2" opacity="0.55" />
      <path d="M8 18 L60 12 L66 48 L14 54 Z" fill="#86a3ae" opacity="0.5" />

      {/* glass face */}
      <path d="M8 14 L60 8 L66 44 L14 50 Z" fill="url(#csTop)" stroke="#86a8b5" strokeWidth="0.8" />
      {/* diagonal sheen */}
      <path d="M20 13 L34 11 L24 47 L12 49 Z" fill="#ffffff" opacity="0.22" />
      {/* corner glint */}
      <circle cx="58" cy="11" r="2.4" fill="#ffffff" opacity="0.85" />
    </svg>
  );
}
