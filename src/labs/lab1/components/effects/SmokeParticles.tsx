"use client";

import { Sparkles } from "@react-three/drei";

interface SmokeParticlesProps {
  active: boolean;
  position?: [number, number, number];
  count?: number;
}

/**
 * Subtle grey smoke continuously rising above an active flame.
 *
 * Implementation: drei `<Sparkles>` configured for slow-moving small
 * particles in a tall vertical column. Higher noise = more lateral
 * wandering (curl-noise-like behaviour).
 */
export function SmokeParticles({
  active,
  position = [0, 0.5, 0],
  count = 90,
}: SmokeParticlesProps) {
  if (!active) return null;
  return (
    <Sparkles
      count={count}
      scale={[0.07, 0.55, 0.07]}
      size={1.6}
      speed={0.35}
      noise={0.4}
      opacity={0.25}
      color="#aaaaaa"
      position={position}
    />
  );
}
