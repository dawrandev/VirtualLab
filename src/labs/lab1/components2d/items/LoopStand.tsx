"use client";

interface Props {
  width?: number;
  /**
   * Render only the FRONT-facing pieces (front lip + the translucent front of
   * each plastic sleeve). Drawn on top of a seated loop so its handle appears
   * to sit *inside* the frosted sleeve rather than in front of the stand.
   */
  front?: boolean;
}

/**
 * Bacteriological-loop stand (halqa shtativi) — modelled on the real stainless
 * stand: a low folded-steel base with two perforated shelves and a single row
 * of translucent white plastic sleeves rising from the holes. Each loop's brass
 * handle slides down into a sleeve so the wire + ring stand upright.
 *
 * A seated loop is composed in three z-layers by the workbench:
 *   full stand (back)  →  loop  →  <LoopStand front /> (this overlay)
 */
export function LoopStand({ width = 200, front = false }: Props) {
  const w = width;
  const h = w * (180 / 220);
  const cols = [50, 80, 110, 140, 170];

  const Sleeves = (opacity: number) =>
    cols.map((cx) => (
      <g key={`sl-${cx}-${opacity}`}>
        {/* sleeve body */}
        <rect x={cx - 7} y={70} width={14} height={66} rx={7} fill="url(#lpSleeve)" opacity={opacity} stroke="#cdd4d8" strokeWidth="0.5" />
        {/* cylinder highlight */}
        <rect x={cx - 4} y={73} width={2.4} height={58} rx={1.2} fill="#ffffff" opacity={opacity * 0.8} />
        {/* mouth rim */}
        <ellipse cx={cx} cy={70} rx={7} ry={2.6} fill="#f3f6f7" opacity={opacity} stroke="#c4ccd0" strokeWidth="0.5" />
      </g>
    ));

  const FrontPieces = (
    <>
      {/* upper-shelf front lip */}
      <polygon points="32,108 188,108 188,114 32,114" fill="url(#lpLip)" />
      <polyline points="32,108 188,108" fill="none" stroke="#ffffff" strokeWidth="1.1" opacity="0.6" />
      {/* translucent fronts of the sleeves (frost a seated handle) */}
      {Sleeves(0.5)}
    </>
  );

  return (
    <div style={{ position: "relative", width: w, height: h, filter: front ? undefined : "drop-shadow(0 6px 7px rgba(0,0,0,0.24))" }}>
      <svg width={w} height={h} viewBox="0 0 220 180">
        <defs>
          <linearGradient id="lpWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f4f6" />
            <stop offset="40%" stopColor="#c2cbd0" />
            <stop offset="100%" stopColor="#7e878d" />
          </linearGradient>
          <linearGradient id="lpShelf" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cfd7dc" />
            <stop offset="45%" stopColor="#eff3f5" />
            <stop offset="100%" stopColor="#c4ccd1" />
          </linearGradient>
          <linearGradient id="lpShelfB" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#aab3b9" />
            <stop offset="55%" stopColor="#cdd5d9" />
            <stop offset="100%" stopColor="#9ba5ab" />
          </linearGradient>
          <linearGradient id="lpLip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#929ca2" />
            <stop offset="100%" stopColor="#646e74" />
          </linearGradient>
          <radialGradient id="lpHole" cx="50%" cy="35%" r="62%">
            <stop offset="0%" stopColor="#6d767c" />
            <stop offset="70%" stopColor="#3d4348" />
            <stop offset="100%" stopColor="#272c30" />
          </radialGradient>
          {/* Frosted translucent plastic sleeve */}
          <linearGradient id="lpSleeve" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#e9eef1" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#cdd5da" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {front ? (
          FrontPieces
        ) : (
          <>
            {/* Ground shadow */}
            <ellipse cx="110" cy="162" rx="96" ry="8" fill="#000" opacity="0.15" />
            {/* Base foot */}
            <polygon points="28,142 192,142 210,120 46,120" fill="url(#lpShelfB)" stroke="#7d878d" strokeWidth="0.8" />
            <polygon points="28,142 192,142 192,149 28,149" fill="url(#lpLip)" />
            {/* Lower shelf */}
            <polygon points="32,138 188,138 208,114 52,114" fill="url(#lpShelfB)" stroke="#7d878d" strokeWidth="0.8" />
            {/* End walls */}
            <polygon points="32,108 52,84 52,114 32,138" fill="url(#lpWall)" stroke="#737d83" strokeWidth="0.8" />
            <polygon points="188,108 208,84 208,114 188,138" fill="url(#lpWall)" stroke="#737d83" strokeWidth="0.8" />
            <polygon points="37,110 45,90 47,92 41,134" fill="#ffffff" opacity="0.3" />
            <polygon points="193,110 201,92 203,94 197,132" fill="#ffffff" opacity="0.26" />
            {/* Upper shelf */}
            <polygon points="32,108 188,108 208,84 52,84" fill="url(#lpShelf)" stroke="#828c92" strokeWidth="0.8" />
            {/* holes the sleeves rise from */}
            {cols.map((cx) => (
              <ellipse key={`h-${cx}`} cx={cx + 6} cy={94} rx={8} ry={3.4} fill="url(#lpHole)" />
            ))}
            {/* sleeve bodies (opaque-ish, behind the loop) */}
            {Sleeves(1)}
            {/* front lip + sleeve fronts (also part of the full stand) */}
            {FrontPieces}
          </>
        )}
      </svg>
    </div>
  );
}
