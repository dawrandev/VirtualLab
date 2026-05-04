"use client";

import { Cylinder } from "@react-three/drei";
import { FireShader } from "./effects/FireShader";
import { HeatHaze } from "./effects/HeatHaze";
import { useLabStore } from "@/stores/labStore";

interface Props {
  position?: [number, number, number];
}

/**
 * Spirit lamp: brass base + chimney + volumetric flame.
 * The brass body is upgraded with clearcoat/anisotropy for realistic
 * brushed-metal highlights.
 */
export function SpiritLamp({ position = [0, 0, 0] }: Props) {
  const lit = useLabStore((s) => s.state.lamp.lit);

  return (
    <group position={position}>
      {/* Base — warm brass with clearcoat */}
      <Cylinder args={[0.06, 0.07, 0.05, 32]} position={[0, 0.025, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#a08050"
          metalness={0.85}
          roughness={0.32}
          clearcoat={0.4}
          clearcoatRoughness={0.5}
          anisotropy={0.3}
        />
      </Cylinder>
      {/* Chimney — slightly cooler-toned brass */}
      <Cylinder args={[0.05, 0.05, 0.07, 24]} position={[0, 0.085, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#b09060"
          metalness={0.85}
          roughness={0.28}
          clearcoat={0.45}
          clearcoatRoughness={0.4}
          anisotropy={0.4}
        />
      </Cylinder>
      {/* Wick */}
      <Cylinder args={[0.008, 0.008, 0.02, 12]} position={[0, 0.13, 0]} castShadow>
        <meshStandardMaterial
          color={lit ? "#ff8030" : "#3a2a1a"}
          emissive={lit ? "#ff5020" : "#000000"}
          emissiveIntensity={lit ? 0.6 : 0}
          roughness={0.95}
        />
      </Cylinder>

      {/* Volumetric flame */}
      <FireShader active={lit} position={[0, 0.16, 0]} height={0.22} width={0.1} />

      {/* Heat haze rising above the flame */}
      <HeatHaze active={lit} position={[0, 0.5, 0]} width={0.2} height={0.4} />

      {/* Warm point-light source from the flame */}
      {lit && (
        <pointLight position={[0, 0.25, 0]} intensity={0.9} distance={1.4} color="#ff9540" />
      )}
    </group>
  );
}
