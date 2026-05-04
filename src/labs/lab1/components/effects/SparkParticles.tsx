"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, InstancedMesh, Matrix4, Object3D, Vector3 } from "three";

const POOL = 60;
const PARTICLE_LIFE = 0.45; // seconds
const COLOR_HOT = new Color("#fff5b0");
const COLOR_COOL = new Color("#ff5818");

interface Particle {
  pos: Vector3;
  vel: Vector3;
  life: number; // remaining seconds
  size: number;
}

interface SparkParticlesProps {
  /** When true, sparks emit each frame. */
  active: boolean;
  /** World position of the emission origin. */
  origin: [number, number, number];
  /** Per-frame emission rate when active. */
  rate?: number;
}

/**
 * Instanced spark particles for the matchbox-strike interaction.
 *
 * - Pool of `POOL` instances reused as particles expire.
 * - Each tick (when active), some new sparks spawn at `origin` with
 *   randomised upward + lateral velocity.
 * - Per-frame physics: simple gravity + linear damping.
 * - Color lerps hot-yellow → cool-orange over the particle's life.
 * - Additive blend to feed bloom postprocess.
 */
export function SparkParticles({ active, origin, rate = 6 }: SparkParticlesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: POOL }, () => ({
        pos: new Vector3(0, -10, 0),
        vel: new Vector3(),
        life: 0,
        size: 0,
      })),
    [],
  );
  const emitAccumRef = useRef(0);

  useFrame((_, dt) => {
    if (!meshRef.current) return;

    // Emit while active
    if (active) {
      emitAccumRef.current += dt * rate;
      while (emitAccumRef.current >= 1) {
        emitAccumRef.current -= 1;
        const dead = particles.find((p) => p.life <= 0);
        if (!dead) break;
        dead.pos.set(origin[0], origin[1], origin[2]);
        // Mostly upward, slight horizontal spread
        const ang = Math.random() * Math.PI * 2;
        const horizSpeed = 0.05 + Math.random() * 0.08;
        dead.vel.set(
          Math.cos(ang) * horizSpeed,
          0.18 + Math.random() * 0.18,
          Math.sin(ang) * horizSpeed,
        );
        dead.life = PARTICLE_LIFE * (0.7 + Math.random() * 0.6);
        dead.size = 0.0025 + Math.random() * 0.002;
      }
    }

    // Simulate + write instance matrices
    const tmpColor = new Color();
    for (let i = 0; i < POOL; i++) {
      const p = particles[i];
      if (p.life > 0) {
        // Gravity + damping
        p.vel.y -= 1.2 * dt;
        p.vel.multiplyScalar(0.96);
        p.pos.addScaledVector(p.vel, dt);
        p.life -= dt;
        const lifeT = Math.max(0, p.life / PARTICLE_LIFE);
        const scale = p.size * lifeT;
        dummy.position.copy(p.pos);
        dummy.scale.setScalar(Math.max(0.0001, scale));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        tmpColor.copy(COLOR_HOT).lerp(COLOR_COOL, 1 - lifeT);
        meshRef.current.setColorAt?.(i, tmpColor);
      } else {
        // Park dead particles far away with zero scale so they don't render
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, POOL]}
      frustumCulled={false}
      renderOrder={5}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.9}
        toneMapped={false}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

void Matrix4;
