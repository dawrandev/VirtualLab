"use client";

import { Html } from "@react-three/drei";
import {
  CuboidCollider,
  CylinderCollider,
  RigidBody,
} from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { Draggable3D } from "@/components/three/Draggable3D";
import { ZoneRegistryProvider } from "@/components/three/ZoneRegistry";
import { PHYS_MASKS } from "@/engine/physics/CollisionGroups";
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
import { SparkParticles } from "./effects/SparkParticles";
import { SmokeParticles } from "./effects/SmokeParticles";
import { SteamParticles } from "./effects/SteamParticles";
import { Droplet } from "./effects/Droplet";
import {
  BurnCountdown,
  DryingCountdown,
  FrictionRing,
  StainingChip,
  SterilizationRing,
} from "./HudTimers";

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

  // Unified timer ticker (10 Hz). Decrements:
  //   - match.burnTimeLeft and computes burnProgress
  //   - fixation.dryingTimeLeft (after 3 passes)
  //   - dye.timeLeft (replaces the previous setInterval inside StainingTimer)
  // 10 Hz keeps countdown chips visually smooth while keeping the patch
  // rate low enough that the score-recompute cost is negligible.
  const patch = useLabStore((s) => s.patch);
  useEffect(() => {
    const dt = 0.1;
    const interval = setInterval(() => {
      const s = useLabStore.getState().state;
      const matchActive = s.match.lit && !s.match.burned;
      const dryingActive =
        s.fixation.passes >= 3 && !s.fixation.isDried && s.fixation.dryingTimeLeft > 0;
      const dyeActive = s.dye.applied && !s.dye.matured && s.dye.timeLeft > 0;
      if (!matchActive && !dryingActive && !dyeActive) return;

      patch((draft) => {
        if (matchActive) {
          draft.match.burnTimeLeft = Math.max(0, draft.match.burnTimeLeft - dt);
          draft.match.burnProgress = 1 - draft.match.burnTimeLeft / 5;
          if (draft.match.burnTimeLeft <= 0 && !draft.match.hasIgnitedLamp) {
            // Match expired before lighting the lamp.
            draft.match.lit = false;
            draft.match.burned = true;
          }
        }
        if (dryingActive) {
          draft.fixation.dryingTimeLeft = Math.max(0, draft.fixation.dryingTimeLeft - dt);
          if (draft.fixation.dryingTimeLeft <= 0) {
            draft.fixation.isDried = true;
            draft.fixation.isDrying = false;
          }
        }
        if (dyeActive) {
          draft.dye.timeLeft = Math.max(0, draft.dye.timeLeft - dt);
          if (draft.dye.timeLeft <= 0) {
            draft.dye.matured = true;
          }
        }
      });
    }, 100);
    return () => clearInterval(interval);
  }, [patch]);

  // Droplet emit triggers: count + last-known dispense position. Bumped from
  // DraggablePipette's onDrop so the visible droplet falls from where the
  // user actually released the pipette tip (not from its rest position).
  const [dyeDrop, setDyeDrop] = useState<{
    count: number;
    from: [number, number, number];
  }>({ count: 0, from: [0.6, 0.84, 0.4] });
  const [waterDrop, setWaterDrop] = useState<{
    count: number;
    from: [number, number, number];
  }>({ count: 0, from: [0.8, 0.84, 0.4] });

  // Live readouts for particle gating
  const friction = useLabStore((s) => s.state.match.frictionDistance);
  const matchLit = useLabStore((s) => s.state.match.lit);
  const matchBurned = useLabStore((s) => s.state.match.burned);
  const lampLit = useLabStore((s) => s.state.lamp.lit);
  const fixationPasses = useLabStore((s) => s.state.fixation.passes);
  const fixationDryingTimeLeft = useLabStore(
    (s) => s.state.fixation.dryingTimeLeft,
  );
  const isDried = useLabStore((s) => s.state.fixation.isDried);
  const smearCompleted = useLabStore((s) => s.state.smear.completed);
  const dyeApplied = useLabStore((s) => s.state.dye.applied);

  // Sparks fire while the user is rubbing (any progress, not yet lit/burned)
  const sparksActive = friction > 0.001 && !matchLit && !matchBurned;

  // Steam: rises off the slide while it's mid-fixation (passes 1-2) and
  // continuously while drying after pass 3.
  const steamActive =
    smearCompleted &&
    !dyeApplied &&
    ((fixationPasses > 0 && fixationPasses < 3) ||
      (fixationPasses >= 3 && !isDried && fixationDryingTimeLeft > 0));

  return (
    <ZoneRegistryProvider>
      {/* Static physics colliders for the lab table top so falling tools land on it. */}
      <RigidBody type="fixed" colliders={false} collisionGroups={PHYS_MASKS.table}>
        <CuboidCollider args={[1.3, 0.02, 0.6]} position={[0, 0.78, 0]} />
      </RigidBody>

      {/* Spirit lamp — body collider blocks tools from clipping into the lamp.
          The wick + flame remain visual-only sensors via ZoneRegistry. */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0, 0.83, 0.1]}
        collisionGroups={PHYS_MASKS.staticProp}
      >
        <SpiritLamp position={[0, 0, 0]} />
        <CylinderCollider args={[0.06, 0.07]} position={[0, 0.06, 0]} />
      </RigidBody>

      {/* Matchbox — match rests ON TOP, can't pass through. */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[-0.4, 0.81, 0.2]}
        collisionGroups={PHYS_MASKS.staticProp}
      >
        <Matchbox position={[0, 0, 0]} />
        <CuboidCollider args={[0.045, 0.012, 0.025]} position={[0, 0.012, 0]} />
      </RigidBody>

      {/* Culture tube — collider only at the stand level; loop must be able
          to dip into the open tube from above, so no wall collider on the
          tube body itself. */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0.5, 0.85, 0]}
        collisionGroups={PHYS_MASKS.staticProp}
      >
        <CultureTube position={[0, 0, 0]} />
        <CylinderCollider args={[0.005, 0.045]} position={[0, -0.075, 0]} />
      </RigidBody>

      {/* Microscope — base + arm. Decorative collider; tools rarely
          interact closely with the microscope. */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[0.9, 0.81, -0.2]}
        collisionGroups={PHYS_MASKS.staticProp}
      >
        <Microscope position={[0, 0, 0]} />
        <CuboidCollider args={[0.09, 0.025, 0.06]} position={[0, 0.025, 0]} />
        <CuboidCollider args={[0.02, 0.11, 0.02]} position={[0, 0.16, 0]} />
      </RigidBody>

      <Zones />
      <FixationCounter />

      {/* Particle systems */}
      <SparkParticles active={sparksActive} origin={[-0.4, 0.835, 0.2]} rate={18} />
      <SmokeParticles active={lampLit} position={[0, 1.1, 0.1]} />
      <SteamParticles active={steamActive} position={[0, 1.05, 0.1]} count={32} />

      {/* Droplets */}
      <Droplet
        trigger={dyeDrop.count}
        from={dyeDrop.from}
        toY={0.812}
        color="#b366ff"
      />
      <Droplet
        trigger={waterDrop.count}
        from={waterDrop.from}
        toY={0.812}
        color="#aaccff"
      />

      <DraggableMatch />
      <DraggableLoop />
      <DraggableSlide />
      <DraggablePipette
        variant="dye"
        initialPosition={[0.4, 0.86, 0.45]}
        onDispense={(pos) =>
          setDyeDrop((d) => ({ count: d.count + 1, from: pos }))
        }
      />
      <DraggablePipette
        variant="water"
        initialPosition={[1.1, 0.86, 0.45]}
        onDispense={(pos) =>
          setWaterDrop((d) => ({ count: d.count + 1, from: pos }))
        }
      />
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

  return (
    <Draggable3D
      toolId="match"
      initialPosition={MATCH_REST_POSITION}
      mode={{ kind: "translate", planeY: MATCH_CARRY_PLANE_Y }}
      // Match head sits at +0.063 X local, lifted by the 20° group tilt.
      interactionOffset={[0.063, 0.018, 0]}
      acceptedZones={["matchbox-strike", "lamp-wick"]}
      collider={{ kind: "cuboid", args: [0.06, 0.003, 0.003] }}
      mass={0.005}
      fallToSurfaceOnRelease
      // Burned match is consumed and visually hidden — there's nothing
      // to grab anymore.
      disabled={matchState.burned}
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
      <FrictionRing />
      <BurnCountdown />
    </Draggable3D>
  );
}

// ============================================================================
// Bacterial Loop — Step 1: hold in flame; Step 2: dip in tube; Step 3: orbit on slide
// ============================================================================

function DraggableLoop() {
  const dispatch = useLabStore((s) => s.dispatchAction);
  const isSterilized = useLabStore((s) => s.state.sterilization.isSterilized);
  const hasSample = useLabStore((s) => s.state.sampling.hasSample);
  const smearCompleted = useLabStore((s) => s.state.smear.completed);

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
      collider={{ kind: "cuboid", args: [0.07, 0.008, 0.008] }}
      mass={0.02}
      restPosition={LOOP_REST}
      // The user wants to be able to put the loop down anywhere at any
      // time — fall onto whatever surface is below instead of springing
      // back to a fixed rest position.
      fallToSurfaceOnRelease
      mode={{ kind: "translate", planeY: 0.86 }}
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
      <SterilizationRing />
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
  const dyeApplied = useLabStore((s) => s.state.dye.applied);
  const washCompleted = useLabStore((s) => s.state.wash.completed);

  // Switch to rotate mode after dye applied, before wash completed.
  const rotateMode = dyeApplied && !washCompleted;
  const SLIDE_REST: [number, number, number] = [-0.7, 0.81, 0.4];

  return (
    <Draggable3D
      toolId="slide"
      initialPosition={SLIDE_REST}
      // Slide is centred on its origin — no interaction offset needed
      acceptedZones={["fixation-flame"]}
      collider={{ kind: "cuboid", args: [0.0375, 0.0008, 0.0125] }}
      mass={0.01}
      restPosition={SLIDE_REST}
      // The slide has fixed interaction zones (slide-dye / slide-water /
      // fixation-flame) that don't follow the slide if it moves. Always
      // tween back to rest after release (except in rotate mode where the
      // user is actively holding the slide tilted for the wash angle) —
      // otherwise dye/wash drops would miss the slide visually.
      returnToRestOnRelease={() => !rotateMode}
      mode={
        rotateMode
          ? { kind: "rotate", axis: "z", sensitivity: 4 }
          : // Slide drag plane is just above its resting Y so picking it up
            // doesn't teleport. Zones are tall columns extending up over the
            // lamp so horizontal motion is enough to enter the flame.
            { kind: "translate", planeY: 0.83 }
      }
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
      <DryingCountdown />
      <StainingChip />
    </Draggable3D>
  );
}

// ============================================================================
// Pipettes — Step 5a: drop dye, Step 5b: drop water
// ============================================================================

function DraggablePipette({
  variant,
  initialPosition,
  onDispense,
}: {
  variant: "dye" | "water";
  initialPosition: [number, number, number];
  /** Fired with the world position of the pipette tip when a successful
   * drop happens — Lab1Scene uses this to spawn a falling droplet. */
  onDispense?: (worldPos: [number, number, number]) => void;
}) {
  const dispatch = useLabStore((s) => s.dispatchAction);
  const slideRotation = useLabStore((s) => s.state.slide.rotation);

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
      collider={{ kind: "cuboid", args: [0.018, 0.04, 0.018] }}
      mass={0.015}
      restPosition={initialPosition}
      // Let the pipette fall onto whatever surface is below when released
      // outside the slide-dye / slide-water zones. The user can pick it up
      // again from wherever it lands.
      fallToSurfaceOnRelease
      mode={{ kind: "translate", planeY: initialPosition[1] }}
      onDrop={(zoneId, payload) => {
        if (zoneId !== dropZone) return;
        const tip: [number, number, number] = [
          payload.worldPos.x,
          payload.worldPos.y,
          payload.worldPos.z,
        ];
        onDispense?.(tip);
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
