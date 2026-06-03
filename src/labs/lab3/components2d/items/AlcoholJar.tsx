"use client";

interface Props {
  width?: number;
  /**
   * Render only the FRONT glass + alcohol level — drawn over a dipped spreader
   * so its working end reads as submerged in the alcohol (3-layer: jar back →
   * spreader → jar front).
   */
  front?: boolean;
}

/**
 * Tall glass jar of alcohol — the Drigalski spreader's working end is dipped
 * here (then flamed). A clear cylindrical beaker with an alcohol level, glass
 * specular highlights and a soft base shadow.
 */
export function AlcoholJar({ width = 110, front = false }: Props) {
  const w = width;
  const h = w * (210 / 110);

  const liquid = (
    <>
      <path d="M22 96 L88 96 L86 192 Q86 200 78 200 L32 200 Q24 200 24 192 Z" fill="url(#ajLiquid)" />
      <ellipse cx="55" cy="96" rx="32" ry="6" fill="#dfeef2" opacity="0.7" />
    </>
  );

  return (
    <svg width={w} height={h} viewBox="0 0 110 210" style={{ overflow: "visible", filter: front ? undefined : "drop-shadow(0 6px 7px rgba(0,0,0,0.22))" }}>
      <defs>
        <linearGradient id="ajGlass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c4d4db" stopOpacity="0.45" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.78" />
          <stop offset="70%" stopColor="#e7eef1" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a9bcc4" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="ajLiquid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#eef6f8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#cfe0e6" stopOpacity="0.62" />
        </linearGradient>
      </defs>

      {front ? (
        <>
          {/* Alcohol level (semi-transparent) tints the submerged spreader end */}
          {liquid}
          {/* Front glass sheen + rim, occluding the very front */}
          <ellipse cx="55" cy="22" rx="36" ry="7" fill="none" stroke="#90a4ac" strokeWidth="1.2" opacity="0.7" />
          <rect x="30" y="30" width="4" height="160" rx="2" fill="#ffffff" opacity="0.45" />
        </>
      ) : (
        <>
          {/* Base shadow */}
          <ellipse cx="55" cy="202" rx="40" ry="7" fill="#000" opacity="0.14" />
          {/* Jar body */}
          <path d="M19 24 L91 24 L88 192 Q88 202 78 202 L32 202 Q22 202 22 192 Z" fill="url(#ajGlass)" stroke="#90a4ac" strokeWidth="1.4" />
          {/* Alcohol level */}
          {liquid}
          {/* Rim */}
          <ellipse cx="55" cy="24" rx="36" ry="8" fill="#eef4f6" opacity="0.7" stroke="#90a4ac" strokeWidth="1.2" />
          {/* Specular highlights */}
          <rect x="29" y="32" width="5" height="158" rx="2.5" fill="#ffffff" opacity="0.55" />
          <rect x="40" y="36" width="2" height="150" rx="1" fill="#ffffff" opacity="0.3" />
          {/* Label */}
          <rect x="36" y="130" width="38" height="26" rx="2" fill="#f6f6f2" opacity="0.92" stroke="#cfcabd" strokeWidth="0.6" />
          <text x="55" y="147" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fontWeight="bold" fill="#5b6770">spirt</text>
        </>
      )}
    </svg>
  );
}
