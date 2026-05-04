"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, type Mesh } from "three";

interface DropletProps {
  /** Increments each time a new droplet should be emitted. */
  trigger: number;
  /** World position where the droplet starts (pipette tip). */
  from: [number, number, number];
  /** World Y to fall to (slide top surface). */
  toY: number;
  /** Tint of the droplet (purple for dye, light-blue for water). */
  color: string;
  /** Total fall duration in seconds. */
  fallDuration?: number;
}

/**
 * A single animated droplet that falls from `from` to `(from.x, toY,
 * from.z)` when `trigger` increments. After landing, it shrinks and
 * fades to imitate a splash. No physics body — this is purely visual,
 * runs at 60 fps via useFrame.
 *
 * The animation re-arms whenever `trigger` is bumped, so back-to-back
 * drops work cleanly.
 */
export function Droplet({
  trigger,
  from,
  toY,
  color,
  fallDuration = 0.45,
}: DropletProps) {
  const meshRef = useRef<Mesh>(null);
  const [armed, setArmed] = useState(false);
  const tRef = useRef(0);
  const lastTriggerRef = useRef(trigger);
  const colorObj = useRef(new Color(color));

  useEffect(() => {
    if (trigger > lastTriggerRef.current) {
      lastTriggerRef.current = trigger;
      tRef.current = 0;
      setArmed(true);
    }
  }, [trigger]);

  useFrame((_, dt) => {
    if (!armed || !meshRef.current) return;
    tRef.current += dt;

    const total = fallDuration + 0.18; // fall + splash decay
    if (tRef.current >= total) {
      setArmed(false);
      return;
    }

    const fallT = Math.min(1, tRef.current / fallDuration);
    // Quadratic gravity ease for natural fall
    const easeY = fallT * fallT;
    const y = from[1] + (toY - from[1]) * easeY;
    meshRef.current.position.set(from[0], y, from[2]);

    if (fallT < 1) {
      meshRef.current.scale.setScalar(1);
    } else {
      // Splash decay: shrink + fade after impact
      const decayT = (tRef.current - fallDuration) / 0.18;
      const s = Math.max(0.001, 1.4 * (1 - decayT));
      meshRef.current.scale.set(s, 0.3 * (1 - decayT), s);
    }
  });

  if (!armed) return null;

  return (
    <mesh ref={meshRef} position={from}>
      <sphereGeometry args={[0.005, 12, 12]} />
      <meshPhysicalMaterial
        color={colorObj.current}
        transmission={0.55}
        ior={1.33}
        thickness={0.005}
        roughness={0.05}
        attenuationColor={colorObj.current}
        attenuationDistance={0.1}
      />
    </mesh>
  );
}
