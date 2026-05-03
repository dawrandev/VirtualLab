"use client";

import { Cylinder } from "@react-three/drei";
import { useLabStore } from "@/stores/labStore";

interface Props {
  position?: [number, number, number];
}

/**
 * Culture tube — outer glass + inner liquid mesh whose Y scale is bound
 * to sampling.liquidLevel (0..1). Liquid color: bacterial green-brown.
 */
export function CultureTube({ position = [0, 0, 0] }: Props) {
  const liquidLevel = useLabStore((s) => s.state.sampling.liquidLevel);
  const tubeHeight = 0.14;
  const liquidScale = Math.max(0.05, liquidLevel);

  return (
    <group position={position}>
      {/* Glass tube */}
      <Cylinder args={[0.018, 0.018, tubeHeight, 24, 1, true]} position={[0, tubeHeight / 2, 0]}>
        <meshPhysicalMaterial
          transmission={0.95}
          thickness={0.4}
          roughness={0.05}
          ior={1.5}
          color="#dceaff"
          attenuationColor="#cce8ff"
          attenuationDistance={0.4}
          transparent
          opacity={0.9}
        />
      </Cylinder>
      {/* Liquid */}
      <Cylinder
        args={[0.016, 0.016, tubeHeight * liquidScale, 24]}
        position={[0, (tubeHeight * liquidScale) / 2, 0]}
      >
        <meshStandardMaterial color="#5d8b3a" roughness={0.6} transparent opacity={0.85} />
      </Cylinder>
      {/* Cap */}
      <Cylinder args={[0.02, 0.02, 0.012, 16]} position={[0, tubeHeight + 0.006, 0]}>
        <meshStandardMaterial color="#374151" roughness={0.6} metalness={0.2} />
      </Cylinder>
      {/* Stand support */}
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.04, 0.045, 0.01, 16]} />
        <meshStandardMaterial color="#525965" roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}
