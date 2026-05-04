"use client";

import { Cylinder } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, type Group, type Mesh, type MeshStandardMaterial } from "three";
import { useLabStore } from "@/stores/labStore";
import { FireShader } from "./effects/FireShader";

interface Props {
  position?: [number, number, number];
}

const COLD_HEAD = new Color("#dc2626"); // unlit phosphorus
const HOT_HEAD = new Color("#ffaa30"); // pre-ignition glow
const LIT_HEAD = new Color("#ff8030"); // freshly lit
const CHAR_HEAD = new Color("#1f1f1f"); // charred at burnout
const LIT_EMISSIVE = new Color("#ff5020");

const FRICTION_THRESHOLD = 0.05; // metres — kept in sync with Lab1Scene

/**
 * Match with three visual phases:
 *
 *  1. **Rubbing** — head color lerps cold→hot as `frictionDistance` rises.
 *     Stick is at full length.
 *  2. **Burning** — head color lerps lit-orange → char-grey across the
 *     5s `burnProgress`. Stick physically shrinks 12cm → 9cm with the
 *     held (tail) end staying anchored. The head sphere slides toward
 *     the tail to follow the shrinking tip. A volumetric flame burns
 *     at the tip.
 *  3. **Burned** — once the match has ignited the lamp it disappears.
 */
export function Match({ position = [0, 0, 0] }: Props) {
  const matchState = useLabStore((s) => s.state.match);
  const headMatRef = useRef<MeshStandardMaterial>(null);
  const stickRef = useRef<Mesh>(null);
  const headHolderRef = useRef<Group>(null);
  const flameHolderRef = useRef<Group>(null);

  useFrame(() => {
    const mat = headMatRef.current;
    const stick = stickRef.current;
    const headHolder = headHolderRef.current;
    const flameHolder = flameHolderRef.current;
    if (!mat) return;

    if (matchState.burned) {
      mat.color.set("#1f1208");
      mat.emissive.set("#000");
      mat.emissiveIntensity = 0;
      return;
    }

    if (matchState.lit) {
      const p = Math.max(0, Math.min(1, matchState.burnProgress));

      // Head color and emissive lerp from lit-orange → charred over the burn
      mat.color.lerpColors(LIT_HEAD, CHAR_HEAD, p);
      mat.emissive.copy(LIT_EMISSIVE).lerp(new Color("#000"), p);
      mat.emissiveIntensity = 0.75 * (1 - p * 0.75);

      // Stick shrinks: full length 0.12, end length 0.09. Held (tail) end
      // stays put — we offset the cylinder's center toward +X to keep
      // the tail anchored as the head end recedes.
      const shrink = 0.25 * p; // 0..0.25
      if (stick) {
        stick.scale.y = 1 - shrink;
        stick.position.x = -0.06 * shrink;
      }
      // Head + flame slide toward the tail along with the receding tip.
      const tipDelta = -0.12 * shrink;
      if (headHolder) headHolder.position.x = 0.063 + tipDelta;
      if (flameHolder) flameHolder.position.x = 0.087 + tipDelta;
      return;
    }

    // Pre-ignition: friction-driven heat
    const t = Math.min(1, matchState.frictionDistance / FRICTION_THRESHOLD);
    mat.color.lerpColors(COLD_HEAD, HOT_HEAD, t);
    mat.emissive.copy(HOT_HEAD).multiplyScalar(t * 0.5);
    mat.emissiveIntensity = t;

    // Reset stick / head positions at full length
    if (stick) {
      stick.scale.y = 1;
      stick.position.x = 0;
    }
    if (headHolder) headHolder.position.x = 0.063;
    if (flameHolder) flameHolder.position.x = 0.087;
  });

  if (matchState.burned) return null;

  const stickColor = "#a16207";

  return (
    <group position={position} rotation={[0, 0, 0.35]}>
      {/* Stick — 12cm long. Cylinder default axis is Y; we rotate it so
          the long axis is X. Length-scaling along the stick is therefore
          a Y-axis scale on the mesh. */}
      <Cylinder
        ref={stickRef}
        args={[0.005, 0.005, 0.12, 16]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <meshStandardMaterial color={stickColor} roughness={0.9} />
      </Cylinder>

      {/* Head — sphere on the burning end. Wrapped in a holder group so we
          can slide it toward the tail as the stick shrinks. */}
      <group ref={headHolderRef} position={[0.063, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.011, 20, 20]} />
          <meshStandardMaterial ref={headMatRef} color={COLD_HEAD} roughness={0.7} />
        </mesh>
      </group>

      {/* Flame — only while lit. Holder group is positioned independently
          so it tracks the receding tip. */}
      {matchState.lit && (
        <group ref={flameHolderRef} position={[0.087, 0.018, 0]}>
          <FireShader
            active
            position={[0, 0, 0]}
            height={0.06}
            width={0.025}
            color="#ffb060"
            magnitude={0.9}
          />
        </group>
      )}
    </group>
  );
}
