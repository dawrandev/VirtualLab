"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Cylinder, Torus } from "@react-three/drei";
import { Color, MeshPhysicalMaterial } from "three";
import { useLabStore } from "@/stores/labStore";

interface Props {
  position?: [number, number, number];
}

const COLD = new Color("#a3a3a3");
const HOT = new Color("#ff5020");

/**
 * Bacterial inoculation loop: nichrome wire + small ring at the tip.
 *
 * Wire + ring share a single MeshPhysicalMaterial instance whose color +
 * emissive lerp from cold-grey → hot-orange as the user holds the loop in
 * the flame (`sterilization.holdMs`). Anisotropy is enabled to give the
 * brushed-wire highlights a directional shimmer.
 */
export function BacterialLoop({ position = [0, 0, 0] }: Props) {
  const sterilizationHoldMs = useLabStore((s) => s.state.sterilization.holdMs);
  const heatRef = useRef(0);

  // One material for both wire pieces — keeps them visually unified and
  // saves a draw call vs. two separate materials.
  const wireMaterial = useMemo(
    () =>
      new MeshPhysicalMaterial({
        color: COLD.clone(),
        metalness: 0.95,
        roughness: 0.35,
        clearcoat: 0.2,
        clearcoatRoughness: 0.3,
        anisotropy: 0.6,
      }),
    [],
  );

  useFrame((_, delta) => {
    const target = Math.min(1, sterilizationHoldMs / 3000);
    heatRef.current += (target - heatRef.current) * Math.min(1, delta * 1.4);
    wireMaterial.color.lerpColors(COLD, HOT, heatRef.current);
    wireMaterial.emissive.copy(HOT).multiplyScalar(heatRef.current * 0.7);
  });

  return (
    <group position={position}>
      {/* Handle — matte plastic */}
      <Cylinder
        args={[0.006, 0.006, 0.12, 16]}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#1f2937" roughness={0.6} />
      </Cylinder>
      {/* Wire shaft (shares wireMaterial) */}
      <Cylinder
        args={[0.0015, 0.0015, 0.06, 8]}
        rotation={[0, 0, Math.PI / 2]}
        position={[0.085, 0, 0]}
        material={wireMaterial}
        castShadow
      />
      {/* Loop ring (shares wireMaterial) */}
      <Torus
        args={[0.012, 0.0015, 8, 24]}
        position={[0.122, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        material={wireMaterial}
        castShadow
      />
    </group>
  );
}
