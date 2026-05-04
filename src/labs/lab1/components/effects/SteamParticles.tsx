"use client";

import { Sparkles } from "@react-three/drei";

interface SteamParticlesProps {
  active: boolean;
  position?: [number, number, number];
  count?: number;
  /** Tint of the steam (white for vapor, light-grey for haze). */
  color?: string;
}

/**
 * White-ish steam puff rising above a hot surface (slide passing through
 * the fixation flame, or slide drying after fixation completes).
 */
export function SteamParticles({
  active,
  position = [0, 0.1, 0],
  count = 35,
  color = "#e7e7e7",
}: SteamParticlesProps) {
  if (!active) return null;
  return (
    <Sparkles
      count={count}
      scale={[0.06, 0.16, 0.04]}
      size={2.2}
      speed={0.55}
      noise={0.3}
      opacity={0.45}
      color={color}
      position={position}
    />
  );
}
