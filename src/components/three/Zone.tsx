"use client";

import { useEffect } from "react";
import { Vector3 } from "three";
import type { ZoneId } from "@/engine/types";
import { useZoneRegistry, type ZoneShape } from "./ZoneRegistry";

interface SphereZoneProps {
  id: ZoneId;
  shape: "sphere";
  position: [number, number, number];
  radius: number;
  /** Show a faint visualisation (debug). */
  debug?: boolean;
  debugColor?: string;
}

interface BoxZoneProps {
  id: ZoneId;
  shape: "box";
  position: [number, number, number];
  size: [number, number, number];
  debug?: boolean;
  debugColor?: string;
}

export type ZoneProps = SphereZoneProps | BoxZoneProps;

/**
 * Invisible interaction zone. Registers a bounding volume with ZoneRegistry by id.
 * If `debug` is true, renders a translucent wireframe for development feedback.
 */
export function Zone(props: ZoneProps) {
  const registry = useZoneRegistry();

  useEffect(() => {
    let shape: ZoneShape;
    if (props.shape === "sphere") {
      shape = {
        kind: "sphere",
        center: new Vector3(...props.position),
        radius: props.radius,
      };
    } else {
      const [px, py, pz] = props.position;
      const [sx, sy, sz] = props.size;
      shape = {
        kind: "box",
        min: new Vector3(px - sx / 2, py - sy / 2, pz - sz / 2),
        max: new Vector3(px + sx / 2, py + sy / 2, pz + sz / 2),
      };
    }
    return registry.register({ id: props.id, shape });
  }, [registry, props]);

  if (!props.debug) return null;

  if (props.shape === "sphere") {
    return (
      <mesh position={props.position}>
        <sphereGeometry args={[props.radius, 16, 16]} />
        <meshBasicMaterial
          color={props.debugColor ?? "#ff00aa"}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
    );
  }

  return (
    <mesh position={props.position}>
      <boxGeometry args={props.size} />
      <meshBasicMaterial
        color={props.debugColor ?? "#00ffaa"}
        wireframe
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}
