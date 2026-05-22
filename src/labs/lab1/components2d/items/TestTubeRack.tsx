"use client";

interface Props {
  width?: number;
  /**
   * Render only the FRONT-facing pieces (front lips + the near rim of the
   * front-row holes). Drawn on top of a seated tube so the tube appears to pass
   * *through* the hole: the body above the hole sticks out, the hole opening and
   * front lip occlude it, and the lower body shows through the open front.
   */
  front?: boolean;
}

/**
 * Stainless-steel test-tube rack (probirka shtativi) — modelled on a real
 * polished-steel rack: an open box frame with two perforated horizontal plates
 * (holes on top, shallow dimples on the bottom that cradle each tube's base)
 * and two solid mirror-finish end walls. The front and back are open so the
 * tube bodies show between the plates.
 *
 * Drawn in a shallow front-above (oblique) projection: the back edge is lifted
 * up and shifted right, so circular holes read as ellipses.
 *
 * A seated tube is composed in three z-layers by the workbench:
 *   full rack (back)  →  tube  →  <TestTubeRack front /> (this overlay)
 */
export function TestTubeRack({ width = 340, front = false }: Props) {
  const w = width;
  const h = w * (210 / 340);

  // Hole / dimple column centres (middle column at x=170 so a centred tube
  // seats in the front-centre hole). Back rows are nudged right + up by the
  // perspective offset.
  const frontHoles = [74, 122, 170, 218, 266];
  const backHoles = [90, 138, 186, 234, 282];

  // Front-row holes. `withDark` fills the recess (used by the empty rack);
  // the front OVERLAY omits the dark fill so a seated tube fills its own hole
  // (no dark ring shows over the glass) while the rims still read as an edge.
  const frontRow = (withDark: boolean) =>
    frontHoles.map((cx) => (
      <g key={`fh-${cx}-${withDark}`}>
        {withDark && <ellipse cx={cx} cy={88} rx={17} ry={7.2} fill="url(#rkHole)" />}
        <path d={`M ${cx - 16} 87 A 17 7.2 0 0 1 ${cx + 16} 87`} fill="none" stroke="#eef2f4" strokeWidth="1.1" opacity="0.55" />
        <path d={`M ${cx - 13} 90 A 17 7.2 0 0 0 ${cx + 13} 90`} fill="none" stroke="#1f2428" strokeWidth="1.1" opacity="0.4" />
      </g>
    ));

  const frontLip = (
    <>
      {/* front lip of the top plate (shadowed band) */}
      <polygon points="45,95 295,95 295,101 45,101" fill="url(#rkLip)" />
      {/* bright rolled front edge */}
      <polyline points="45,95 295,95" fill="none" stroke="#ffffff" strokeWidth="1.3" opacity="0.65" />
    </>
  );
  const bottomLip = <polygon points="45,165 295,165 295,172 45,172" fill="url(#rkLip)" />;

  // Overlay (painted on top of a seated tube): lips + hole rims, NO dark fill.
  const FrontPieces = (
    <>
      {frontLip}
      {frontRow(false)}
      {bottomLip}
    </>
  );

  return (
    <div style={{ position: "relative", width: w, height: h, filter: front ? undefined : "drop-shadow(0 7px 8px rgba(0,0,0,0.26))" }}>
      <svg width={w} height={h} viewBox="0 0 340 210">
        <defs>
          {/* Mirror-polished side wall */}
          <linearGradient id="rkWallV" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f4f6" />
            <stop offset="38%" stopColor="#c2cbd0" />
            <stop offset="72%" stopColor="#98a2a8" />
            <stop offset="100%" stopColor="#7c868c" />
          </linearGradient>
          {/* Top plate surface (light sweeping back-right) */}
          <linearGradient id="rkTop" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#cfd7dc" />
            <stop offset="45%" stopColor="#eff3f5" />
            <stop offset="100%" stopColor="#c4ccd1" />
          </linearGradient>
          {/* Bottom plate surface */}
          <linearGradient id="rkBottom" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#aab3b9" />
            <stop offset="55%" stopColor="#cdd5d9" />
            <stop offset="100%" stopColor="#9ba5ab" />
          </linearGradient>
          {/* Front lip (in shadow under the plate) */}
          <linearGradient id="rkLip" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#929ca2" />
            <stop offset="100%" stopColor="#646e74" />
          </linearGradient>
          {/* Recessed hole interior */}
          <radialGradient id="rkHole" cx="50%" cy="32%" r="62%">
            <stop offset="0%" stopColor="#6d767c" />
            <stop offset="68%" stopColor="#3d4348" />
            <stop offset="100%" stopColor="#272c30" />
          </radialGradient>
          {/* Concave bottom dimple */}
          <radialGradient id="rkDimple" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#828c92" />
            <stop offset="100%" stopColor="#bcc4c9" />
          </radialGradient>
        </defs>

        {front ? (
          FrontPieces
        ) : (
          <>
            {/* Ground contact shadow */}
            <ellipse cx="186" cy="180" rx="150" ry="11" fill="#000" opacity="0.16" />

            {/* ---- Bottom plate (drawn first; tubes' bases rest here) ---- */}
            <polygon points="45,165 295,165 323,131 73,131" fill="url(#rkBottom)" stroke="#7d878d" strokeWidth="0.8" />
            {backHoles.map((cx) => (
              <ellipse key={`bd-${cx}`} cx={cx} cy={136} rx={8.5} ry={3.8} fill="url(#rkDimple)" stroke="#8d979d" strokeWidth="0.5" />
            ))}
            {frontHoles.map((cx) => (
              <ellipse key={`fd-${cx}`} cx={cx} cy={152} rx={9} ry={4} fill="url(#rkDimple)" stroke="#8d979d" strokeWidth="0.5" />
            ))}

            {/* ---- End walls (solid polished steel) ---- */}
            <polygon points="45,95 73,61 73,131 45,165" fill="url(#rkWallV)" stroke="#737d83" strokeWidth="0.8" />
            <polygon points="295,95 323,61 323,131 295,165" fill="url(#rkWallV)" stroke="#737d83" strokeWidth="0.8" />
            <polygon points="51,98 60,76 63,78 54,160" fill="#ffffff" opacity="0.34" />
            <polygon points="66,72 70,64 71,128 67,124" fill="#ffffff" opacity="0.20" />
            <polygon points="301,98 309,80 311,82 304,158" fill="#ffffff" opacity="0.30" />
            <polygon points="316,66 320,62 321,126 317,122" fill="#ffffff" opacity="0.18" />
            <polygon points="56,128 64,120 64,150 50,160" fill="#4f595f" opacity="0.22" />
            <polygon points="306,126 314,120 314,148 300,158" fill="#4f595f" opacity="0.20" />

            {/* ---- Top plate ---- */}
            <polygon points="45,95 295,95 323,61 73,61" fill="url(#rkTop)" stroke="#828c92" strokeWidth="0.8" />
            <polygon points="62,90 300,90 314,73 76,73" fill="#ffffff" opacity="0.12" />
            {/* back-row holes */}
            {backHoles.map((cx) => (
              <g key={`bh-${cx}`}>
                <ellipse cx={cx} cy={69} rx={15} ry={6.4} fill="url(#rkHole)" />
                <path d={`M ${cx - 14} 68 A 15 6.4 0 0 1 ${cx + 14} 68`} fill="none" stroke="#eef2f4" strokeWidth="1" opacity="0.55" />
              </g>
            ))}
            {/* front lip + front-row holes (with recess) + bottom lip */}
            {frontLip}
            {frontRow(true)}
            {bottomLip}
          </>
        )}
      </svg>
    </div>
  );
}
