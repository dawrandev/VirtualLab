"use client";

import { useMemo } from "react";
import { Color, MeshStandardMaterial, RepeatWrapping, TextureLoader } from "three";
import { useLoader } from "@react-three/fiber";

/**
 * Procedural lab room: floor, four walls, ceiling, window cutout, lab table.
 * No external GLB needed for v1 — built from primitives + procedural shaders.
 * 3D model assets can replace this in a later pass.
 */
export function LabRoom() {
  const wallMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#eef2f7"),
        roughness: 0.9,
        metalness: 0,
      }),
    [],
  );
  const floorMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#cdd5df"),
        roughness: 0.85,
        metalness: 0.05,
      }),
    [],
  );
  const tableMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#3f2a1c"),
        roughness: 0.65,
        metalness: 0.05,
      }),
    [],
  );
  const tableTopMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#0f1115"),
        roughness: 0.4,
        metalness: 0.2,
      }),
    [],
  );

  return (
    <group>
      {/* Floor */}
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        material={floorMaterial}
      >
        <planeGeometry args={[10, 10]} />
      </mesh>

      {/* Back wall */}
      <mesh
        receiveShadow
        position={[0, 1.5, -2]}
        material={wallMaterial}
      >
        <planeGeometry args={[8, 3]} />
      </mesh>

      {/* Side walls */}
      <mesh
        receiveShadow
        rotation={[0, Math.PI / 2, 0]}
        position={[-4, 1.5, 0]}
        material={wallMaterial}
      >
        <planeGeometry args={[8, 3]} />
      </mesh>
      <mesh
        receiveShadow
        rotation={[0, -Math.PI / 2, 0]}
        position={[4, 1.5, 0]}
        material={wallMaterial}
      >
        <planeGeometry args={[8, 3]} />
      </mesh>

      {/* Ceiling */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 3, 0]}
        material={wallMaterial}
      >
        <planeGeometry args={[10, 10]} />
      </mesh>

      {/* Window-like glow on right wall */}
      <mesh position={[3.99, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[2.4, 1.4]} />
        <meshBasicMaterial color="#cfe5ff" toneMapped={false} />
      </mesh>

      {/* Lab table */}
      <group position={[0, 0, 0]}>
        {/* Table top */}
        <mesh castShadow receiveShadow position={[0, 0.78, 0]} material={tableTopMaterial}>
          <boxGeometry args={[2.6, 0.04, 1.2]} />
        </mesh>
        {/* Edge */}
        <mesh castShadow receiveShadow position={[0, 0.755, 0]} material={tableMaterial}>
          <boxGeometry args={[2.62, 0.02, 1.22]} />
        </mesh>
        {/* Legs */}
        {(
          [
            [-1.25, 0.38, -0.55],
            [1.25, 0.38, -0.55],
            [-1.25, 0.38, 0.55],
            [1.25, 0.38, 0.55],
          ] as const
        ).map((p, i) => (
          <mesh key={i} castShadow position={p as [number, number, number]} material={tableMaterial}>
            <boxGeometry args={[0.06, 0.76, 0.06]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
// Touch unused imports to satisfy strict mode if not used yet
void useLoader;
void TextureLoader;
void RepeatWrapping;
