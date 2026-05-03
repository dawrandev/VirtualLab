"use client";

import { Cylinder } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Color, type MeshStandardMaterial } from "three";
import { useLabStore } from "@/stores/labStore";
import { FireShader } from "./effects/FireShader";

interface Props {
  position?: [number, number, number];
}

const COLD_HEAD = new Color("#dc2626"); // red phosphorus
const HOT_HEAD = new Color("#ffaa30"); // pre-ignition glow

const FRICTION_THRESHOLD = 0.10;

export function Match({ position = [0, 0, 0] }: Props) {
  const matchState = useLabStore((s) => s.state.match);
  const headMatRef = useRef<MeshStandardMaterial>(null);

  // All hooks declared before any conditional return (Rules of Hooks).
  useFrame(() => {
    if (!headMatRef.current) return;
    const mat = headMatRef.current;
    if (matchState.burned) {
      mat.color.set("#1f1208");
      mat.emissive.set("#000");
      mat.emissiveIntensity = 0;
      return;
    }
    if (matchState.lit) {
      mat.color.set("#ff8030");
      mat.emissive.set("#ff5020");
      mat.emissiveIntensity = 0.7;
      return;
    }
    // Friction heat ramp
    const t = Math.min(1, matchState.frictionDistance / FRICTION_THRESHOLD);
    mat.color.lerpColors(COLD_HEAD, HOT_HEAD, t);
    mat.emissive.copy(HOT_HEAD).multiplyScalar(t * 0.5);
    mat.emissiveIntensity = t;
  });

  // Once the match has done its job (igniting the lamp) it's used up — hide it.
  if (matchState.burned) return null;

  const stickColor = matchState.burned ? "#1f1208" : "#a16207";

  // Match is tilted up ~20° (head higher than tail) for a natural held look.
  return (
    <group position={position} rotation={[0, 0, 0.35]}>
      {/* Stick — 12 cm long, fatter for visibility */}
      <Cylinder
        args={[0.005, 0.005, 0.12, 16]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <meshStandardMaterial color={stickColor} roughness={0.9} />
      </Cylinder>
      {/* Head — bigger, attached at +X end */}
      <mesh position={[0.063, 0, 0]} castShadow>
        <sphereGeometry args={[0.011, 20, 20]} />
        <meshStandardMaterial ref={headMatRef} color={COLD_HEAD} roughness={0.7} />
      </mesh>
      {matchState.lit && (
        <FireShader active position={[0.087, 0.018, 0]} height={0.08} width={0.035} />
      )}
    </group>
  );
}
