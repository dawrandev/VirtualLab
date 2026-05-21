"use client";

interface Props {
  width?: number;
}

/**
 * Medical kidney tray (лоток почкообразный) — cream enamelled steel with a
 * dark rim, modelled on the reference photo. Drawn slightly from above with a
 * bowl-depth gradient + gloss so it reads as a real 3D dish that the staining
 * bridge sits across and excess dye drips into.
 */
export function KidneyTray({ width = 230 }: Props) {
  const w = width;
  const h = w * 0.62;
  // Reniform outline (concave along the upper-middle edge).
  const shape =
    "M22 78 C22 44 60 30 96 44 C116 52 126 52 146 44 C184 29 214 46 210 86 C206 122 168 134 126 129 C84 124 22 114 22 78 Z";
  const inner =
    "M40 78 C40 54 70 44 98 56 C118 64 128 64 148 56 C178 45 198 60 195 88 C191 116 160 122 126 118 C90 114 40 104 40 78 Z";
  return (
    <div style={{ position: "relative", width: w, height: h, filter: "drop-shadow(0 6px 8px rgba(0,0,0,0.28))" }}>
      <svg width={w} height={h} viewBox="0 0 232 150">
        <defs>
          <radialGradient id="ktEnamel" cx="44%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#fbf2cf" />
            <stop offset="60%" stopColor="#f1e2a7" />
            <stop offset="100%" stopColor="#d9c483" />
          </radialGradient>
          <linearGradient id="ktRim" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3a3a40" />
            <stop offset="50%" stopColor="#15151a" />
            <stop offset="100%" stopColor="#0a0a0d" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="120" cy="135" rx="98" ry="12" fill="#000" opacity="0.14" />

        {/* Dark enamel rim (outer) */}
        <path d={shape} fill="url(#ktRim)" />
        {/* Inner cream basin */}
        <path d={inner} fill="url(#ktEnamel)" stroke="#0c0c10" strokeWidth="1" />
        {/* Bowl-depth inner shadow near the rim */}
        <path d={inner} fill="none" stroke="#b09a55" strokeWidth="3" opacity="0.35" />
        {/* Specular gloss streak */}
        <path
          d="M58 60 C90 50 150 52 180 64 C150 60 96 60 64 70 Z"
          fill="#ffffff"
          opacity="0.5"
        />
        <ellipse cx="86" cy="66" rx="20" ry="6" fill="#ffffff" opacity="0.35" />
      </svg>
    </div>
  );
}
