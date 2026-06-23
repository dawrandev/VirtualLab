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
  /**
   * Wider + shorter proportions — used for the chlorine disinfectant jar, which
   * has to hold BOTH the used spreader and the used pipette side by side without
   * them merging into one shape. The tall narrow profile stays the default.
   */
  wide?: boolean;
}

/** Per-shape geometry so the tall and wide jars share one renderer. */
function geometry(wide: boolean) {
  if (wide) {
    return {
      vbW: 180,
      vbH: 150,
      body: "M22 20 L158 20 L153 128 Q153 138 143 138 L37 138 Q27 138 27 128 Z",
      liquid: "M31 68 L149 68 L147 128 Q147 134 141 134 L39 134 Q33 134 33 128 Z",
      surf: { cx: 90, cy: 68, rx: 57, ry: 6 },
      rim: { cx: 90, cy: 20, rx: 60, ry: 8 },
      base: { cx: 90, cy: 140, rx: 72, ry: 7 },
      hi1: { x: 34, y: 28, w: 6, h: 100 },
      hi2: { x: 50, y: 32, w: 2, h: 92 },
      label: { x: 66, y: 92, w: 48, h: 24, tx: 90, ty: 108 },
      frontRim: { cx: 90, cy: 20, rx: 60, ry: 7 },
      frontHi: { x: 34, y: 28, w: 4, h: 100 },
    };
  }
  return {
    vbW: 110,
    vbH: 210,
    body: "M19 24 L91 24 L88 192 Q88 202 78 202 L32 202 Q22 202 22 192 Z",
    liquid: "M22 96 L88 96 L86 192 Q86 200 78 200 L32 200 Q24 200 24 192 Z",
    surf: { cx: 55, cy: 96, rx: 32, ry: 6 },
    rim: { cx: 55, cy: 24, rx: 36, ry: 8 },
    base: { cx: 55, cy: 202, rx: 40, ry: 7 },
    hi1: { x: 29, y: 32, w: 5, h: 158 },
    hi2: { x: 40, y: 36, w: 2, h: 150 },
    label: { x: 33, y: 130, w: 44, h: 26, tx: 55, ty: 147 },
    frontRim: { cx: 55, cy: 22, rx: 36, ry: 7 },
    frontHi: { x: 30, y: 30, w: 4, h: 160 },
  };
}

/**
 * Glass jar. As "alcohol" the Drigalski spreader's working end is dipped here
 * then flamed; as "chlorine" it is the 5% disinfectant the used spreader (and
 * pipette) are dropped into afterwards (pale greenish liquid). A clear beaker
 * with a liquid level, glass specular highlights and a soft base shadow. The
 * `wide` proportions are used for the chlorine jar so two instruments fit.
 */
export function AlcoholJar({ width, front = false, variant = "alcohol", label, wide = false }: Props) {
  const isChlorine = variant === "chlorine";
  const g = geometry(wide);
  const w = width ?? g.vbW;
  const h = w * (g.vbH / g.vbW);
  const liqId = `ajLiquid-${variant}-${wide ? "w" : "t"}`;
  const glassId = `ajGlass-${variant}-${wide ? "w" : "t"}`;
  const labelText = label ?? (isChlorine ? "5% xlor" : "spirt");
  const surface = isChlorine ? "#e7f1cf" : "#dfeef2";

  const liquid = (
    <>
      <path d={g.liquid} fill={`url(#${liqId})`} />
      <ellipse cx={g.surf.cx} cy={g.surf.cy} rx={g.surf.rx} ry={g.surf.ry} fill={surface} opacity="0.7" />
    </>
  );

  return (
    <svg width={w} height={h} viewBox={`0 0 ${g.vbW} ${g.vbH}`} style={{ overflow: "visible", filter: front ? undefined : "drop-shadow(0 6px 7px rgba(0,0,0,0.22))" }}>
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
          {/* Liquid level (semi-transparent) tints the submerged tool ends */}
          {liquid}
          {/* Front glass sheen + rim, occluding the very front */}
          <ellipse cx={g.frontRim.cx} cy={g.frontRim.cy} rx={g.frontRim.rx} ry={g.frontRim.ry} fill="none" stroke="#90a4ac" strokeWidth="1.2" opacity="0.7" />
          <rect x={g.frontHi.x} y={g.frontHi.y} width={g.frontHi.w} height={g.frontHi.h} rx="2" fill="#ffffff" opacity="0.45" />
        </>
      ) : (
        <>
          {/* Base shadow */}
          <ellipse cx={g.base.cx} cy={g.base.cy} rx={g.base.rx} ry={g.base.ry} fill="#000" opacity="0.14" />
          {/* Jar body */}
          <path d={g.body} fill={`url(#${glassId})`} stroke="#90a4ac" strokeWidth="1.4" />
          {/* Liquid level */}
          {liquid}
          {/* Rim */}
          <ellipse cx={g.rim.cx} cy={g.rim.cy} rx={g.rim.rx} ry={g.rim.ry} fill="#eef4f6" opacity="0.7" stroke="#90a4ac" strokeWidth="1.2" />
          {/* Specular highlights */}
          <rect x={g.hi1.x} y={g.hi1.y} width={g.hi1.w} height={g.hi1.h} rx="2.5" fill="#ffffff" opacity="0.55" />
          <rect x={g.hi2.x} y={g.hi2.y} width={g.hi2.w} height={g.hi2.h} rx="1" fill="#ffffff" opacity="0.3" />
          {/* Label */}
          <rect x={g.label.x} y={g.label.y} width={g.label.w} height={g.label.h} rx="2" fill="#f6f6f2" opacity="0.92" stroke="#cfcabd" strokeWidth="0.6" />
          <text x={g.label.tx} y={g.label.ty} textAnchor="middle" fontFamily="sans-serif" fontSize={isChlorine ? 8 : 9} fontWeight="bold" fill="#5b6770">{labelText}</text>
        </>
      )}
    </svg>
  );
}
