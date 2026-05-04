"use client";

import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { CameraControls } from "./CameraControls";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  N8AO,
  ToneMapping,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, type ReactNode } from "react";
import { Vector2 } from "three";
import { LabRoom } from "./LabRoom";
import { PhysicsRoot } from "./PhysicsRoot";

interface LabCanvasProps {
  children?: ReactNode;
}

/**
 * Top-level 3D canvas: camera, lights, environment, postprocessing.
 * Children are mounted inside the lit room scene under a Rapier physics root.
 */
export function LabCanvas({ children }: LabCanvasProps) {
  const debugPhysics =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("debugPhysics");

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
      }}
      camera={{
        position: [0, 1.55, 1.6],
        fov: 45,
        near: 0.1,
        far: 50,
      }}
      style={{ background: "#0f1115" }}
    >
      <Suspense fallback={null}>
        <Environment preset="warehouse" environmentIntensity={0.5} />
        {/* Slight key light from window direction */}
        <directionalLight
          position={[3, 4, 2]}
          intensity={2.4}
          color="#fff5e1"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={20}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.0005}
        />
        {/* Cool fluorescent ceiling fill */}
        <pointLight position={[0, 2.7, 0]} intensity={0.6} color="#dceaff" />
        {/* Warm rim from behind */}
        <pointLight position={[-2, 1.6, -1.5]} intensity={0.4} color="#ffd9a8" />
        <PhysicsRoot debug={debugPhysics}>
          <LabRoom />
          {children}
        </PhysicsRoot>
      </Suspense>

      <CameraControls />

      <EffectComposer multisampling={0} enableNormalPass>
        <N8AO halfRes intensity={1.2} aoRadius={0.35} distanceFalloff={0.6} />
        <Bloom
          mipmapBlur
          luminanceThreshold={0.85}
          luminanceSmoothing={0.2}
          intensity={0.55}
        />
        <ChromaticAberration
          offset={new Vector2(0.0008, 0.0008)}
          radialModulation={false}
          modulationOffset={0}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
