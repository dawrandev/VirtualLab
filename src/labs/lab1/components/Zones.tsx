"use client";

import { Zone } from "@/components/three/Zone";

/**
 * Declarative list of all interaction zones for Lab 1.
 *
 * Design choice — zones are TALL VERTICAL COLUMNS so that tools whose drag
 * plane sits just above the table (Y ≈ 0.83-0.86) still register inside
 * volumes that visually live near the lamp wick / flame (Y ≈ 0.96-1.06).
 * This avoids the "tool jumps 20 cm on pickup" problem.
 *
 * Toggle via URL `?debugZones` to render wireframes for tuning.
 */
const DEBUG =
  typeof window !== "undefined" &&
  window.location.search.includes("debugZones");

export function Zones() {
  return (
    <>
      {/* Match-strike strip — column above the matchbox.
          Match drags at Y≈0.85; this column covers 0.81..1.00 for safety. */}
      <Zone
        id="matchbox-strike"
        shape="box"
        position={[-0.4, 0.905, 0.20]}
        size={[0.13, 0.19, 0.09]}
        debug={DEBUG}
        debugColor="#ff5566"
      />

      {/* Lamp wick — sphere over the wick top. Reaches down to the match drag
          plane so a horizontally-carried match enters when over the wick. */}
      <Zone
        id="lamp-wick"
        shape="sphere"
        position={[0, 0.92, 0.1]}
        radius={0.11}
        debug={DEBUG}
        debugColor="#ffaa00"
      />

      {/* Flame zone — tall column over the lamp for loop sterilization. The
          loop drag plane is ~0.86; this column reaches from 0.82 to 1.10
          so the loop tip enters when XZ are near the lamp. */}
      <Zone
        id="flame"
        shape="box"
        position={[0, 0.96, 0.1]}
        size={[0.20, 0.28, 0.20]}
        debug={DEBUG}
        debugColor="#ff5500"
      />

      {/* Same flame core for slide fixation — separate id so loop's
          sterilization tracking and slide's pass-counting don't collide. */}
      <Zone
        id="fixation-flame"
        shape="box"
        position={[0, 0.96, 0.1]}
        size={[0.22, 0.28, 0.22]}
        debug={DEBUG}
        debugColor="#ff7733"
      />

      {/* Culture tube interior — tall column. Loop tip dipped from any side. */}
      <Zone
        id="culture-tube"
        shape="box"
        position={[0.5, 0.95, 0]}
        size={[0.08, 0.30, 0.08]}
        debug={DEBUG}
        debugColor="#33dd66"
      />

      {/* Smear/slide-area — tall column above the slide's idle position.
          Loop drag plane Y≈0.86; slide overlay top Y≈0.81. Column covers
          both so loop tip detection works for smearing. */}
      <Zone
        id="slide-area"
        shape="box"
        position={[-0.7, 0.92, 0.4]}
        size={[0.16, 0.30, 0.10]}
        debug={DEBUG}
        debugColor="#9933ff"
      />

      {/* Slide-dye and slide-water — wider/taller boxes covering the slide
          rest area, so a pipette drop lands here at any reasonable height. */}
      <Zone
        id="slide-dye"
        shape="box"
        position={[-0.7, 0.92, 0.4]}
        size={[0.18, 0.30, 0.12]}
        debug={DEBUG}
        debugColor="#cc55ff"
      />
      <Zone
        id="slide-water"
        shape="box"
        position={[-0.7, 0.92, 0.4]}
        size={[0.18, 0.30, 0.12]}
        debug={DEBUG}
        debugColor="#55aaff"
      />

      {/* Microscope stage — sphere over the eyepiece (clickable target) */}
      <Zone
        id="microscope-stage"
        shape="sphere"
        position={[0.9, 1.13, -0.2]}
        radius={0.08}
        debug={DEBUG}
        debugColor="#bbbbbb"
      />
    </>
  );
}
