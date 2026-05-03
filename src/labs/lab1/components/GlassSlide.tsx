"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, type Mesh } from "three";
import { useLabStore } from "@/stores/labStore";

interface Props {
  position?: [number, number, number];
}

const SMEAR_W = 256;
const SMEAR_H = 64;

/**
 * Glass microscope slide with refractive material + a CanvasTexture overlay
 * for the procedural smear. The smear is drawn into a 2D canvas every frame
 * the loop is hovering above the slide; this same canvas is sampled as a
 * decal texture on a thin overlay plane.
 */
export function GlassSlide({ position = [0, 0, 0] }: Props) {
  const meshRef = useRef<Mesh>(null);
  const smearState = useLabStore((s) => s.state.smear);
  const dyeApplied = useLabStore((s) => s.state.dye.applied);
  const washCompleted = useLabStore((s) => s.state.wash.completed);

  const { texture, ctx } = useMemo(() => {
    const cnv = document.createElement("canvas");
    cnv.width = SMEAR_W;
    cnv.height = SMEAR_H;
    const c = cnv.getContext("2d")!;
    c.fillStyle = "rgba(255,255,255,0)";
    c.fillRect(0, 0, SMEAR_W, SMEAR_H);
    const tex = new CanvasTexture(cnv);
    tex.needsUpdate = true;
    return { texture: tex, ctx: c };
  }, []);

  // Whenever smear stroke count goes up, paint a stroke roughly matching orbit phase
  useEffect(() => {
    if (smearState.strokeCount === 0) {
      ctx.clearRect(0, 0, SMEAR_W, SMEAR_H);
      texture.needsUpdate = true;
      return;
    }
    const phase = (smearState.strokeCount / 24) * Math.PI * 4;
    const cx = SMEAR_W * 0.5 + Math.cos(phase) * 30;
    const cy = SMEAR_H * 0.5 + Math.sin(phase) * 12;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
    if (dyeApplied) {
      grd.addColorStop(0, washCompleted ? "rgba(122, 75, 200, 0.55)" : "rgba(140, 90, 220, 0.85)");
      grd.addColorStop(1, "rgba(122, 75, 200, 0)");
    } else {
      grd.addColorStop(0, "rgba(120, 90, 60, 0.45)");
      grd.addColorStop(1, "rgba(120, 90, 60, 0)");
    }
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, SMEAR_W, SMEAR_H);
    texture.needsUpdate = true;
  }, [smearState.strokeCount, dyeApplied, washCompleted, ctx, texture]);

  useFrame(() => {
    // Repaint when state changes pre-emptively
  });

  return (
    <group position={position}>
      {/* Glass body */}
      <mesh ref={meshRef} position={[0, 0.002, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.075, 0.001, 0.025]} />
        <meshPhysicalMaterial
          transmission={0.95}
          thickness={0.05}
          roughness={0.05}
          ior={1.5}
          attenuationColor="#cce8ff"
          attenuationDistance={0.2}
          transparent
          opacity={0.85}
          color="#f8fafc"
        />
      </mesh>
      {/* Frosted edge */}
      <mesh position={[-0.027, 0.0027, 0]}>
        <boxGeometry args={[0.015, 0.0008, 0.025]} />
        <meshStandardMaterial color="#dbe1ea" roughness={0.92} />
      </mesh>
      {/* Smear overlay */}
      <mesh position={[0.005, 0.0035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.06, 0.022]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}
