"use client";

import { Physics } from "@react-three/rapier";
import { type ReactNode } from "react";

interface PhysicsRootProps {
  children: ReactNode;
  /** Toggle Rapier's wireframe collider rendering for development. */
  debug?: boolean;
}

/**
 * Wraps a scene tree in Rapier's <Physics> provider.
 *
 * - `gravity` is Earth's (-9.81 m/s² along Y).
 * - `timeStep="vary"` adapts physics step to frame-rate so simulation
 *   stays stable on slow machines.
 * - `interpolate` smooths visible body positions between physics ticks.
 */
export function PhysicsRoot({ children, debug = false }: PhysicsRootProps) {
  return (
    <Physics
      gravity={[0, -9.81, 0]}
      timeStep="vary"
      interpolate
      debug={debug}
    >
      {children}
    </Physics>
  );
}
