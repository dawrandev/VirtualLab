"use client";

import { Cylinder } from "@react-three/drei";
import { useLabStore } from "@/stores/labStore";

interface Props {
  position?: [number, number, number];
}

/**
 * Simple compound microscope. Becomes interactive (click → open view) once
 * `wash.completed` is true.
 */
export function Microscope({ position = [0, 0, 0] }: Props) {
  const washCompleted = useLabStore((s) => s.state.wash.completed);
  const dispatch = useLabStore((s) => s.dispatchAction);
  const ready = washCompleted;

  const handleClick = () => {
    if (!ready) return;
    dispatch("viewMicroscope");
  };

  return (
    <group
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        if (ready) document.body.style.cursor = "pointer";
        e.stopPropagation();
      }}
      onPointerOut={() => (document.body.style.cursor = "default")}
    >
      {/* Base */}
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, 0.05, 0.12]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Stage */}
      <mesh position={[0, 0.07, 0.02]} castShadow>
        <boxGeometry args={[0.13, 0.012, 0.08]} />
        <meshStandardMaterial color="#374151" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Arm */}
      <mesh position={[-0.05, 0.18, -0.04]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 0.22, 0.04]} />
        <meshStandardMaterial color="#1f2937" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Optical tube */}
      <Cylinder args={[0.022, 0.022, 0.18, 24]} position={[0, 0.22, 0.0]} castShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
      </Cylinder>
      {/* Eyepiece */}
      <Cylinder args={[0.018, 0.022, 0.04, 16]} position={[0, 0.32, 0]} castShadow>
        <meshStandardMaterial
          color="#0f172a"
          emissive={ready ? "#80c0ff" : "#000000"}
          emissiveIntensity={ready ? 0.2 : 0}
          roughness={0.4}
          metalness={0.6}
        />
      </Cylinder>
      {/* Objective lenses */}
      <Cylinder args={[0.025, 0.025, 0.04, 24]} position={[0, 0.115, 0.02]} castShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </Cylinder>
      {/* Glow when ready */}
      {ready && (
        <pointLight position={[0, 0.3, 0]} intensity={0.3} distance={0.4} color="#80c0ff" />
      )}
    </group>
  );
}
