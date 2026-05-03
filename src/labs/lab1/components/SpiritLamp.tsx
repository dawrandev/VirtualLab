"use client";

import { Cylinder } from "@react-three/drei";
import { FireShader } from "./effects/FireShader";
import { useLabStore } from "@/stores/labStore";

interface Props {
  position?: [number, number, number];
}

/**
 * Spirit lamp: brushed-steel base + glass chimney + procedural flame
 * gated on lamp.lit state.
 */
export function SpiritLamp({ position = [0, 0, 0] }: Props) {
  const lit = useLabStore((s) => s.state.lamp.lit);

  return (
    <group position={position}>
      {/* Base */}
      <Cylinder args={[0.06, 0.07, 0.05, 32]} position={[0, 0.025, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#666870" metalness={0.85} roughness={0.4} />
      </Cylinder>
      {/* Chimney */}
      <Cylinder
        args={[0.05, 0.05, 0.07, 24]}
        position={[0, 0.085, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#7d8290" metalness={0.85} roughness={0.35} />
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

      {/* Flame */}
      <FireShader active={lit} position={[0, 0.21, 0]} height={0.22} width={0.1} />

      {/* Light from flame */}
      {lit && <pointLight position={[0, 0.25, 0]} intensity={0.6} distance={1.2} color="#ff9540" />}
    </group>
  );
}
