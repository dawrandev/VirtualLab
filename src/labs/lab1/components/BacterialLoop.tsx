"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Cylinder, Torus } from "@react-three/drei";
import type { Mesh, MeshStandardMaterial } from "three";
import { Color } from "three";
import { useLabStore } from "@/stores/labStore";

interface Props {
  position?: [number, number, number];
}

const COLD = new Color("#a3a3a3");
const HOT = new Color("#ff5020");

export function BacterialLoop({ position = [0, 0, 0] }: Props) {
  const ringMatRef = useRef<MeshStandardMaterial>(null);
  const heatRef = useRef(0);
  const meshRef = useRef<Mesh>(null);
  const sterilizationHoldMs = useLabStore((s) => s.state.sterilization.holdMs);

  useFrame((_, delta) => {
    // Heat ratio 0..1 from 0ms..3000ms hold
    const target = Math.min(1, sterilizationHoldMs / 3000);
    heatRef.current += (target - heatRef.current) * Math.min(1, delta * 1.4);
    if (ringMatRef.current) {
      ringMatRef.current.color.lerpColors(COLD, HOT, heatRef.current);
      ringMatRef.current.emissive.copy(HOT).multiplyScalar(heatRef.current * 0.7);
    }
  });

  return (
    <group position={position}>
      {/* Handle */}
      <Cylinder args={[0.006, 0.006, 0.12, 16]} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </Cylinder>
      {/* Wire shaft */}
      <Cylinder
        args={[0.0015, 0.0015, 0.06, 8]}
        rotation={[0, 0, Math.PI / 2]}
        position={[0.085, 0, 0]}
        castShadow
        ref={meshRef}
      >
        <meshStandardMaterial ref={ringMatRef} color={COLD} metalness={0.95} roughness={0.35} />
      </Cylinder>
      {/* Loop ring */}
      <Torus args={[0.012, 0.0015, 8, 24]} position={[0.122, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial ref={ringMatRef} color={COLD} metalness={0.95} roughness={0.35} />
      </Torus>
    </group>
  );
}
