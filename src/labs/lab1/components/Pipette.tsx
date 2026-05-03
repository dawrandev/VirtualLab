"use client";

import { Cylinder, Sphere } from "@react-three/drei";

interface Props {
  position?: [number, number, number];
  variant: "dye" | "water";
}

const VARIANT_COLOR: Record<"dye" | "water", string> = {
  dye: "#7c3aed",
  water: "#60a5fa",
};

/**
 * Reusable pipette: rubber bulb + glass tube. Color determined by variant.
 */
export function Pipette({ position = [0, 0, 0], variant }: Props) {
  const liquidColor = VARIANT_COLOR[variant];
  return (
    <group position={position}>
      {/* Bulb */}
      <Sphere args={[0.018, 16, 16]} position={[0, 0.105, 0]} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.7} />
      </Sphere>
      {/* Glass tube */}
      <Cylinder args={[0.005, 0.005, 0.1, 12]} position={[0, 0.05, 0]} castShadow>
        <meshPhysicalMaterial
          transmission={0.9}
          thickness={0.1}
          roughness={0.05}
          ior={1.5}
          color="#ffffff"
          transparent
          opacity={0.7}
        />
      </Cylinder>
      {/* Liquid inside tube */}
      <Cylinder args={[0.0035, 0.0035, 0.06, 12]} position={[0, 0.04, 0]}>
        <meshStandardMaterial color={liquidColor} roughness={0.4} transparent opacity={0.85} />
      </Cylinder>
      {/* Tip */}
      <Cylinder args={[0.0015, 0.005, 0.012, 8]} position={[0, -0.006, 0]}>
        <meshPhysicalMaterial transmission={0.9} thickness={0.05} roughness={0.05} ior={1.5} transparent opacity={0.7} />
      </Cylinder>
    </group>
  );
}
