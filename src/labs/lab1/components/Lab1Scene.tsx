"use client";

import { Html } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Vector3 } from "three";
import { Draggable3D } from "@/components/three/Draggable3D";
import { ZoneRegistryProvider } from "@/components/three/ZoneRegistry";
import { interactionRegistry } from "@/engine/interactionRegistry";
import type { ZoneId } from "@/engine/types";
import { useLabStore } from "@/stores/labStore";
import { lab1Interactions } from "../interactions";
import { BacterialLoop } from "./BacterialLoop";
import { CultureTube } from "./CultureTube";
import { GlassSlide } from "./GlassSlide";
import { Match } from "./Match";
import { Matchbox } from "./Matchbox";
import { Microscope } from "./Microscope";
import { Pipette } from "./Pipette";
import { SpiritLamp } from "./SpiritLamp";
import { Zones } from "./Zones";

const FRICTION_THRESHOLD = 0.05; // metres — total lateral path length
const STROKES_PER_RADIAN = 2.5; // ~16 strokes per full 2π revolution
const FRICTION_PATCH_INTERVAL = 0.05; // seconds — throttle store updates

// Match begins resting on top of the matchbox (matchbox top ≈ Y=0.834, plus
// match half-thickness so it sits on top, not inside).
const MATCH_REST_POSITION: [number, number, number] = [-0.4, 0.84, 0.20];
// Match drag plane only 1cm above its rest height so picking it up doesn't
// look like a teleport. Zones are tall columns that reach up to the lamp.
const MATCH_CARRY_PLANE_Y = 0.85;

export default function Lab1Scene() {
  // Register Lab1 action handlers.
  useEffect(() => {
    return interactionRegistry.registerMany(lab1Interactions);
  }, []);

  return (
    <ZoneRegistryProvider>
      <SpiritLamp position={[0, 0.83, 0.1]} />
      <Matchbox position={[-0.4, 0.81, 0.2]} />
      <CultureTube position={[0.5, 0.85, 0]} />
      <Microscope position={[0.9, 0.81, -0.2]} />

      <Zones />
      <FixationCounter />
      <StainingTimer />

      <DraggableMatch />
      <DraggableLoop />
      <DraggableSlide />
      <DraggablePipette variant="dye" initialPosition={[0.6, 0.85, 0.4]} />
      <DraggablePipette variant="water" initialPosition={[0.8, 0.85, 0.4]} />
    </ZoneRegistryProvider>
  );
}

// ============================================================================
// Floating fixation pass-counter shown next to the flame during step 4
// ============================================================================

function FixationCounter() {
  const passes = useLabStore((s) => s.state.fixation.passes);
  const smearCompleted = useLabStore((s) => s.state.smear.completed);
  const isFixed = useLabStore((s) => s.state.fixation.isFixed);
  const dyeApplied = useLabStore((s) => s.state.dye.applied);

  // Show only during step 4 — after smear, before dye, before completion.
  const visible = smearCompleted && !dyeApplied;
  if (!visible) return null;

  const colour = passes === 3 ? "#10b981" : passes > 0 ? "#fbbf24" : "#94a3b8";

  return (
    <Html position={[0, 1.18, 0.1]} center distanceFactor={1.4}>
      <div
        style={{
          padding: "6px 12px",
          borderRadius: 8,
          background: "rgba(15,23,42,0.8)",
          border: `1px solid ${colour}`,
          color: colour,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "var(--font-inter), sans-serif",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
        }}
      >
        Fiksatsiya: {passes} / 3
        {isFixed && passes !== 3 && " (3 ideal)"}
      </div>
    </Html>
  );
}

// ============================================================================
// Staining timer — counts down dye.timeLeft from 7 → 0; flips dye.matured = true
// ============================================================================

function StainingTimer() {
  const dyeApplied = useLabStore((s) => s.state.dye.applied);
  const dyeMatured = useLabStore((s) => s.state.dye.matured);
  const dyeTimeLeft = useLabStore((s) => s.state.dye.timeLeft);
  const patch = useLabStore((s) => s.patch);

  useEffect(() => {
    if (!dyeApplied || dyeMatured) return;
    const interval = setInterval(() => {
      patch((s) => {
        const next = s.dye.timeLeft - 1;
        if (next <= 0) {
          s.dye.timeLeft = 0;
          s.dye.matured = true;
        } else {
          s.dye.timeLeft = next;
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dyeApplied, dyeMatured, patch]);

  // Floating indicator above the slide while the timer is ticking
  if (!dyeApplied || dyeMatured) return null;

  return (
    <Html position={[-0.7, 0.95, 0.4]} center distanceFactor={1.4}>
      <div
        style={{
          padding: "6px 14px",
          borderRadius: 8,
          background: "rgba(15,23,42,0.85)",
          border: "1px solid #cc55ff",
          color: "#e9d5ff",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "var(--font-inter), sans-serif",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
        }}
      >
        Bo'yoq ta'sir qiladi… {dyeTimeLeft} sek
      </div>
    </Html>
  );
}

// ============================================================================
// Match — Step 0: rub on matchbox-strike to ignite, then drop on lamp-wick
// ============================================================================

function DraggableMatch() {
  const dispatch = useLabStore((s) => s.dispatchAction);
  const patch = useLabStore((s) => s.patch);
  const matchState = useLabStore((s) => s.state.match);
  const lampLit = useLabStore((s) => s.state.lamp.lit);

  // Local accumulators — patched into the store on a throttled cadence so we
  // don't trigger 60 score recomputes per second while rubbing.
  const localFrictionRef = useRef(0);
  const accumDtRef = useRef(0);

  // Once lamp is lit OR match burned, lock the match in place
  const disabled = lampLit || matchState.burned;

  return (
    <Draggable3D
      toolId="match"
      initialPosition={MATCH_REST_POSITION}
      mode={{ kind: "translate", planeY: MATCH_CARRY_PLANE_Y }}
      // Match head sits at +0.063 X local, lifted by the 20° group tilt.
      interactionOffset={[0.063, 0.018, 0]}
      acceptedZones={["matchbox-strike", "lamp-wick"]}
      fallToSurfaceOnRelease
      disabled={disabled}
      onZoneTick={(zoneId, payload) => {
        if (zoneId !== "matchbox-strike") return;
        if (matchState.lit || matchState.burned) return;

        // Total lateral path-length this frame (any direction on the table plane).
        const dxz = Math.hypot(payload.delta.x, payload.delta.z);
        if (dxz < 0.0003) return; // micro-jitter filter

        localFrictionRef.current += dxz;
        accumDtRef.current += payload.dt;

        // Threshold crossed — light immediately (don't wait for next throttle tick)
        if (localFrictionRef.current >= FRICTION_THRESHOLD) {
          patch((s) => {
            s.match.frictionDistance = FRICTION_THRESHOLD;
            s.match.lit = true;
            s.match.burnTimeLeft = 5;
          });
          localFrictionRef.current = FRICTION_THRESHOLD;
          accumDtRef.current = 0;
          return;
        }

        // Throttled visual-only update so the strike strip glows progressively
        if (accumDtRef.current >= FRICTION_PATCH_INTERVAL) {
          const next = localFrictionRef.current;
          patch((s) => {
            s.match.frictionDistance = next;
          });
          accumDtRef.current = 0;
        }
      }}
      onZoneExit={(zoneId) => {
        if (zoneId !== "matchbox-strike") return;
        if (matchState.lit || matchState.burned) return;
        // Reset friction if user leaves the strike strip before lighting
        localFrictionRef.current = 0;
        accumDtRef.current = 0;
        patch((s) => {
          s.match.frictionDistance = 0;
        });
      }}
      onZoneEnter={(zoneId) => {
        if (zoneId === "lamp-wick" && matchState.lit && !lampLit) {
          dispatch("igniteLamp");
        }
      }}
    >
      <Match position={[0, 0, 0]} />
    </Draggable3D>
  );
}

// ============================================================================
// Bacterial Loop — Step 1: hold in flame; Step 2: dip in tube; Step 3: orbit on slide
// ============================================================================

function DraggableLoop() {
  const dispatch = useLabStore((s) => s.dispatchAction);
  const lampLit = useLabStore((s) => s.state.lamp.lit);
  const isSterilized = useLabStore((s) => s.state.sterilization.isSterilized);
  const hasSample = useLabStore((s) => s.state.sampling.hasSample);
  const smearCompleted = useLabStore((s) => s.state.smear.completed);

  // Loop is enabled once lamp is lit, and disabled once smearing is done
  // (after that the slide is the active tool through step 4+).
  const disabled = !lampLit || smearCompleted;

  // Track angular position around slide centre for smear orbit
  const lastAngleRef = useRef<number | null>(null);
  const LOOP_REST: [number, number, number] = [-0.7, 0.85, 0];

  return (
    <Draggable3D
      toolId="loop"
      initialPosition={LOOP_REST}
      // Loop ring is at +0.122 X local from the handle (group origin)
      interactionOffset={[0.122, 0, 0]}
      acceptedZones={["flame", "culture-tube", "slide-area"]}
      restPosition={LOOP_REST}
      returnToRestOnRelease={(zone) =>
        zone !== "flame" && zone !== "culture-tube" && zone !== "slide-area"
      }
      mode={{ kind: "translate", planeY: 0.86 }}
      disabled={disabled}
      onZoneTick={(zoneId, payload) => {
        if (zoneId === "flame" && !isSterilized) {
          dispatch("sterilizeLoop", { dt: payload.dt });
        }
        if (zoneId === "slide-area" && hasSample && !smearCompleted) {
          // Orbital motion: angle around slide centre (X-Z plane)
          const slideCenter = new Vector3(-0.7, 0.85, 0.4);
          const dx = payload.worldPos.x - slideCenter.x;
          const dz = payload.worldPos.z - slideCenter.z;
          const r = Math.sqrt(dx * dx + dz * dz);
          if (r < 0.01) return;
          const angle = Math.atan2(dz, dx);
          const last = lastAngleRef.current;
          if (last !== null) {
            // Wrap around π
            let dAng = angle - last;
            if (dAng > Math.PI) dAng -= 2 * Math.PI;
            if (dAng < -Math.PI) dAng += 2 * Math.PI;
            const strokes = Math.abs(dAng) * STROKES_PER_RADIAN;
            if (strokes > 0.05) dispatch("createSmearStroke", { strokes });
          }
          lastAngleRef.current = angle;
        } else {
          lastAngleRef.current = null;
        }
      }}
      onZoneEnter={(zoneId) => {
        if (zoneId === "culture-tube" && isSterilized && !hasSample) {
          dispatch("collectSample");
        }
      }}
    >
      <BacterialLoop position={[0, 0, 0]} />
    </Draggable3D>
  );
}

// ============================================================================
// Glass Slide — Step 4: pass through flame; Step 5b: tilt for wash
// ============================================================================

function DraggableSlide() {
  const dispatch = useLabStore((s) => s.dispatchAction);
  const patch = useLabStore((s) => s.patch);
  const smearCompleted = useLabStore((s) => s.state.smear.completed);
  const isFixed = useLabStore((s) => s.state.fixation.isFixed);
  const dyeApplied = useLabStore((s) => s.state.dye.applied);
  const washCompleted = useLabStore((s) => s.state.wash.completed);

  // Slide is enabled from step 4 onwards.
  const disabled = !smearCompleted || washCompleted;
  // Switch to rotate mode after dye applied, before wash completed.
  const rotateMode = dyeApplied && !washCompleted;
  const SLIDE_REST: [number, number, number] = [-0.7, 0.81, 0.4];

  return (
    <Draggable3D
      toolId="slide"
      initialPosition={SLIDE_REST}
      // Slide is centred on its origin — no interaction offset needed
      acceptedZones={["fixation-flame"]}
      restPosition={SLIDE_REST}
      returnToRestOnRelease={(zone) =>
        // In translate mode, snap back unless dropped on the fixation zone.
        // In rotate mode, never tween (the slide is being held in mid-air).
        !rotateMode && zone !== "fixation-flame"
      }
      mode={
        rotateMode
          ? { kind: "rotate", axis: "z", sensitivity: 4 }
          : // Slide drag plane is just above its resting Y so picking it up
            // doesn't teleport. Zones are tall columns extending up over the
            // lamp so horizontal motion is enough to enter the flame.
            { kind: "translate", planeY: 0.83 }
      }
      disabled={disabled}
      onZoneEnter={(zoneId: ZoneId) => {
        // Each entry into the flame counts as a fixation pass — including
        // the 2nd and 3rd. The interaction handler caps passes at 5 itself.
        if (zoneId === "fixation-flame" && smearCompleted) {
          dispatch("fixSmear");
        }
      }}
      onZoneTick={(_, payload) => {
        if (rotateMode) {
          // The Draggable3D has already rotated the group; mirror that into
          // labStore.slide.rotation as degrees so dropWater can read it.
          // Use the group's actual rotation (not pointer delta).
          // We can't access the group from here; instead approximate by
          // converting cumulative pointer delta to degrees per tick.
          const dxDeg = payload.delta.x * 180; // rough mapping
          patch((s) => {
            s.slide.rotation = Math.max(0, Math.min(90, s.slide.rotation + dxDeg));
          });
        }
      }}
    >
      <GlassSlide position={[0, 0, 0]} />
    </Draggable3D>
  );
}

// ============================================================================
// Pipettes — Step 5a: drop dye, Step 5b: drop water
// ============================================================================

function DraggablePipette({
  variant,
  initialPosition,
}: {
  variant: "dye" | "water";
  initialPosition: [number, number, number];
}) {
  const dispatch = useLabStore((s) => s.dispatchAction);
  const slideRotation = useLabStore((s) => s.state.slide.rotation);
  const isFixed = useLabStore((s) => s.state.fixation.isFixed);
  const isDried = useLabStore((s) => s.state.fixation.isDried);
  const dyeApplied = useLabStore((s) => s.state.dye.applied);
  const dyeMatured = useLabStore((s) => s.state.dye.matured);
  const washCompleted = useLabStore((s) => s.state.wash.completed);

  // Disable pipettes until they're relevant.
  const disabled =
    variant === "dye"
      ? !isFixed || !isDried || dyeApplied
      : !dyeApplied || !dyeMatured || washCompleted;

  const dropZone: ZoneId = variant === "dye" ? "slide-dye" : "slide-water";
  const toolId = variant === "dye" ? "dyePipette" : "waterPipette";

  return (
    <Draggable3D
      toolId={toolId}
      initialPosition={initialPosition}
      // Pipette tip is ~0.012 below the bulb (pipette local Y range -0.012..0.123)
      interactionOffset={[0, -0.006, 0]}
      // Each pipette only reacts to its own slide overlay zone
      acceptedZones={variant === "dye" ? ["slide-dye"] : ["slide-water"]}
      restPosition={initialPosition}
      returnToRestOnRelease={() => true}
      mode={{ kind: "translate", planeY: initialPosition[1] }}
      disabled={disabled}
      onDrop={(zoneId) => {
        if (zoneId !== dropZone) return;
        if (variant === "dye") {
          dispatch("dropDye");
        } else {
          dispatch("dropWater", { angleDeg: slideRotation });
        }
      }}
    >
      <Pipette variant={variant} position={[0, 0, 0]} />
    </Draggable3D>
  );
}
