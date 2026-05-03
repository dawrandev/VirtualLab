"use client";

import { useLabStore } from "@/stores/labStore";

interface Props {
  position?: [number, number, number];
}

const FRICTION_THRESHOLD = 0.05; // metres — kept in sync with Lab1Scene

/**
 * Matchbox with a visible strike strip on top so the user has an obvious
 * rubbing target. While the user is rubbing the match (frictionDistance > 0),
 * the strip glows orange to confirm progress.
 */
export function Matchbox({ position = [0, 0, 0] }: Props) {
  const friction = useLabStore((s) => s.state.match.frictionDistance);
  const lit = useLabStore((s) => s.state.match.lit);
  const burned = useLabStore((s) => s.state.match.burned);
  const heat = lit || burned ? 0 : Math.min(1, friction / FRICTION_THRESHOLD);

  return (
    <group position={position}>
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, 0.012, 0]}>
        <boxGeometry args={[0.09, 0.024, 0.05]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.9} />
      </mesh>
      {/* Strike strip on TOP of the lid (the rubbing surface) */}
      <mesh position={[0, 0.0245, 0]}>
        <boxGeometry args={[0.085, 0.0008, 0.046]} />
        <meshStandardMaterial
          color={heat > 0 ? "#a84008" : "#3b1409"}
          emissive={heat > 0 ? "#ff5020" : "#000"}
          emissiveIntensity={heat * 0.6}
          roughness={1.0}
        />
      </mesh>
      {/* Front-face strip (decorative, not interactive) */}
      <mesh position={[0, 0.012, 0.0255]}>
        <boxGeometry args={[0.085, 0.018, 0.0008]} />
        <meshStandardMaterial color="#3b1409" roughness={1.0} />
      </mesh>
    </group>
  );
}
