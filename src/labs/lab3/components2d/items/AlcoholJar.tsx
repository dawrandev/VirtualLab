"use client";

interface Props {
  width?: number;
  /**
   * Render only the FRONT glass + liquid level — drawn over a dipped spreader
   * so its working end reads as submerged (3-layer: jar back → spreader → jar
   * front).
   */
  front?: boolean;
  /** "alcohol" = clear (dip then flame); "chlorine" = pale 5% disinfectant. */
  variant?: "alcohol" | "chlorine";
  /** Label text override (defaults per variant). */
  label?: string;
}

/**
 * Tall glass jar. As "alcohol" the Drigalski spreader's working end is dipped
 * here then flamed; as "chlorine" it is the 5% disinfectant the used spreader
 * is dropped into afterwards (pale greenish liquid). A clear cylindrical beaker
 * with a liquid level, glass specular highlights and a soft base shadow.
 */
export function AlcoholJar({ width = 110, front = false, variant = "alcohol", label }: Props) {
  const w = width;
  const h = w * (210 / 110);
  const liqId = `ajLiquid-${variant}`;
  const glassId = `ajGlass-${variant}`;
  const isChlorine = variant === "chlorine";
  const labelText = label ?? (isChlorine ? "5% xlor" : "spirt");
  const surface = isChlorine ? "#e7f1cf" : "#dfeef2";

  const liquid = (
    <>
      <path d="M22 96 L88 96 L86 192 Q86 200 78 200 L32 200 Q24 200 24 192 Z" fill={`url(#${liqId})`} />
      <ellipse cx="55" cy="96" rx="32" ry="6" fill={surface} opacity="0.7" />
    </>
  );

  return (
    <svg width={w} height={h} viewBox="0 0 110 210" style={{ overflow: "visible", filter: front ? undefined : "drop-shadow(0 6px 7px rgba(0,0,0,0.22))" }}>
      <defs>
        <linearGradient id={glassId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c4d4db" stopOpacity="0.45" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.78" />
          <stop offset="70%" stopColor="#e7eef1" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a9bcc4" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={liqId} x1="0%" y1="0%" x2="0%" y2="100%">
          {isChlorine ? (
            <>
              <stop offset="0%" stopColor="#eef6da" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#cfe09a" stopOpacity="0.72" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#eef6f8" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#cfe0e6" stopOpacity="0.62" />
            </>
          )}
        </linearGradient>
      </defs>

      {front ? (
        <>
          {/* Liquid level (semi-transparent) tints the submerged spreader end */}
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
          <path d="M19 24 L91 24 L88 192 Q88 202 78 202 L32 202 Q22 202 22 192 Z" fill={`url(#${glassId})`} stroke="#90a4ac" strokeWidth="1.4" />
          {/* Liquid level */}
          {liquid}
          {/* Rim */}
          <ellipse cx="55" cy="24" rx="36" ry="8" fill="#eef4f6" opacity="0.7" stroke="#90a4ac" strokeWidth="1.2" />
          {/* Specular highlights */}
          <rect x="29" y="32" width="5" height="158" rx="2.5" fill="#ffffff" opacity="0.55" />
          <rect x="40" y="36" width="2" height="150" rx="1" fill="#ffffff" opacity="0.3" />
          {/* Label */}
          <rect x="33" y="130" width="44" height="26" rx="2" fill="#f6f6f2" opacity="0.92" stroke="#cfcabd" strokeWidth="0.6" />
          <text x="55" y="147" textAnchor="middle" fontFamily="sans-serif" fontSize={isChlorine ? 8 : 9} fontWeight="bold" fill="#5b6770">{labelText}</text>
        </>
      )}
    </svg>
  );
}
