"use client";

import {
  CuboidCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Plane, Quaternion, Raycaster, Vector2, Vector3 } from "three";
import type { ToolId, ZoneId } from "@/engine/types";
import { useLabStore } from "@/stores/labStore";
import { useZoneRegistry } from "./ZoneRegistry";
import { PHYS_MASKS } from "@/engine/physics/CollisionGroups";

export type DragMode =
  | { kind: "translate"; planeY?: number }
  | { kind: "rotate"; axis: "x" | "y" | "z"; sensitivity?: number };

interface PointerDelta {
  worldPos: Vector3;
  delta: Vector3;
  dt: number;
}

interface ColliderShape {
  /** "cuboid" creates a single AABB collider matching the bounding box.
   * Pass explicit args to use a custom CuboidCollider size. */
  kind: "cuboid";
  args: [number, number, number]; // half-extents
}

interface Draggable3DProps {
  toolId: ToolId;
  initialPosition: [number, number, number];
  /** Drag behaviour. Default = translate on the table plane (y=initialPosition[1]). */
  mode?: DragMode;
  /** Local-space offset from the group origin to the tool's "interaction
   * point" (e.g. loop ring tip, pipette nozzle). Zones are queried using
   * this point so the visible tip drives the interaction. */
  interactionOffset?: [number, number, number];
  /** Only these zones are considered when resolving the tool's current zone. */
  acceptedZones?: readonly ZoneId[];
  onZoneTick?: (zoneId: ZoneId, payload: PointerDelta) => void;
  onZoneEnter?: (zoneId: ZoneId, payload: PointerDelta) => void;
  onZoneExit?: (zoneId: ZoneId) => void;
  onDrop?: (zoneId: ZoneId, payload: PointerDelta) => void;
  disabled?: boolean;
  restPosition?: [number, number, number];
  /** If returns true on release, the body kinematic-tweens back to restPosition. */
  returnToRestOnRelease?: (zoneId: ZoneId | null) => boolean;
  /** When true: on release, the body is switched to dynamic and gravity
   * lets it fall onto whatever's below. Mutually exclusive with
   * returnToRestOnRelease. */
  fallToSurfaceOnRelease?: boolean;
  /** Cuboid collider half-extents. Defaults to 5 cm box for prototyping. */
  collider?: ColliderShape;
  /** Optional mass. Defaults to 0.05 kg (matches/loop/slide are all light). */
  mass?: number;
  children: ReactNode;
}

const SHIFT_HINT_DISMISS = "shiftHintDismissed";

/**
 * Pointer-based 3D drag controller backed by a Rapier kinematic body.
 *
 * - On pointer-down: capture pointer, set draggedToolId, body stays
 *   `kinematicPosition`. Each frame `setNextKinematicTranslation` is called
 *   with the current cursor projection — Rapier resolves collisions and
 *   refuses to move the body INTO any solid static collider.
 * - Pointer movement projects to either:
 *    - horizontal plane at the body's current Y (no modifier), OR
 *    - vertical plane perpendicular to camera-XZ direction (Shift held).
 *   The plane is rebuilt every move using the body's current position as
 *   anchor, so toggling Shift mid-drag is seamless.
 * - On pointer-up: fires onDrop, then either tween-back to rest, or
 *   (if `fallToSurfaceOnRelease`) switches body type to dynamic so gravity
 *   lands it on whatever's below.
 *
 * Zone callbacks (onZoneEnter/Tick/Exit/Drop) keep their pre-Rapier API —
 * the registry is queried each frame using the body's actual world position
 * + the tool's interactionOffset.
 */
export function Draggable3D({
  toolId,
  initialPosition,
  mode = { kind: "translate" },
  interactionOffset,
  acceptedZones,
  onZoneTick,
  onZoneEnter,
  onZoneExit,
  onDrop,
  disabled = false,
  restPosition,
  returnToRestOnRelease,
  fallToSurfaceOnRelease = false,
  collider = { kind: "cuboid", args: [0.05, 0.05, 0.05] },
  mass = 0.05,
  children,
}: Draggable3DProps) {
  const rbRef = useRef<RapierRigidBody>(null!);
  const draggingRef = useRef(false);
  const lastPointerWorldRef = useRef(new Vector3());
  const lastFrameWorldRef = useRef(new Vector3());
  const currentZoneRef = useRef<ZoneId | null>(null);
  const targetPosRef = useRef(new Vector3(...initialPosition));
  const targetRotRef = useRef(new Quaternion());
  const tweenTargetRef = useRef<Vector3 | null>(null);
  const isDynamicRef = useRef(false);
  const [hovered, setHovered] = useState(false);

  const { gl, camera } = useThree();
  const registry = useZoneRegistry();
  const startDrag = useLabStore((s) => s.startDrag);
  const endDrag = useLabStore((s) => s.endDrag);

  const raycaster = useRef(new Raycaster());
  const ndc = useRef(new Vector2());
  const dragPlane = useRef(new Plane(new Vector3(0, 1, 0), -initialPosition[1]));
  const intersect = useRef(new Vector3());

  // Build a drag plane based on Shift state + body's current position.
  function buildPlane(shiftHeld: boolean, anchor: Vector3) {
    if (!shiftHeld) {
      // Horizontal plane at the anchor's current Y
      dragPlane.current.setComponents(0, 1, 0, -anchor.y);
      return;
    }
    // Vertical plane facing the camera (normal = camera->anchor projected to XZ)
    const camDir = new Vector3();
    camera.getWorldDirection(camDir);
    camDir.y = 0;
    if (camDir.lengthSq() < 1e-6) {
      // Camera is looking straight down — fall back to Z-axis plane
      camDir.set(0, 0, 1);
    } else {
      camDir.normalize();
    }
    // Plane normal points back toward the camera so positive Y on screen → +Y world
    const planeNormal = camDir.clone().negate();
    const planeDist = -planeNormal.dot(anchor);
    dragPlane.current.setComponents(
      planeNormal.x,
      planeNormal.y,
      planeNormal.z,
      planeDist,
    );
  }

  function projectPointer(e: ThreeEvent<PointerEvent> | PointerEvent): boolean {
    const rect = (gl.domElement as HTMLCanvasElement).getBoundingClientRect();
    ndc.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(ndc.current, camera);
    const hit = raycaster.current.ray.intersectPlane(
      dragPlane.current,
      intersect.current,
    );
    return hit !== null;
  }

  function pointerDown(e: ThreeEvent<PointerEvent>) {
    if (disabled || !rbRef.current) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    // Body must be kinematic during drag (in case it was previously dynamic)
    if (isDynamicRef.current) {
      rbRef.current.setBodyType(2 /* KinematicPositionBased */, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      isDynamicRef.current = false;
    }

    draggingRef.current = true;
    startDrag(toolId);
    document.body.style.cursor = "grabbing";
    tweenTargetRef.current = null;

    // Sync target with body's current position
    const t = rbRef.current.translation();
    const anchor = new Vector3(t.x, t.y, t.z);
    targetPosRef.current.copy(anchor);
    buildPlane(e.shiftKey, anchor);
    if (projectPointer(e)) {
      lastPointerWorldRef.current.copy(intersect.current);
      lastFrameWorldRef.current.copy(anchor);
    }
  }

  function pointerMove(e: ThreeEvent<PointerEvent>) {
    if (disabled || !draggingRef.current || !rbRef.current) return;
    e.stopPropagation();
    const t = rbRef.current.translation();
    const anchor = new Vector3(t.x, t.y, t.z);
    buildPlane(e.shiftKey, anchor);
    if (!projectPointer(e)) return;

    if (mode.kind === "translate") {
      // Pointer projects to dragPlane → that's our next target. Rapier
      // resolves collisions before applying it.
      targetPosRef.current.copy(intersect.current);
    } else {
      // Rotation mode: map pointer-X delta to angular delta on the chosen axis
      const sens = mode.sensitivity ?? 6;
      const dx = intersect.current.x - lastPointerWorldRef.current.x;
      const ang = dx * sens;
      const q = new Quaternion();
      q.setFromAxisAngle(
        new Vector3(
          mode.axis === "x" ? 1 : 0,
          mode.axis === "y" ? 1 : 0,
          mode.axis === "z" ? 1 : 0,
        ),
        ang,
      );
      const cur = rbRef.current.rotation();
      const curQ = new Quaternion(cur.x, cur.y, cur.z, cur.w);
      curQ.multiply(q);
      targetRotRef.current.copy(curQ);
    }
    lastPointerWorldRef.current.copy(intersect.current);
  }

  function pointerUp(e: ThreeEvent<PointerEvent>) {
    if (disabled || !rbRef.current) return;
    e.stopPropagation();
    if (!draggingRef.current) {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      return;
    }
    draggingRef.current = false;
    endDrag();
    document.body.style.cursor = "default";

    const t = rbRef.current.translation();
    const worldPos = new Vector3(t.x, t.y, t.z);
    const zone = currentZoneRef.current;

    if (zone && onDrop) {
      onDrop(zone, { worldPos, delta: new Vector3(), dt: 0 });
    }

    if (returnToRestOnRelease && returnToRestOnRelease(zone)) {
      tweenTargetRef.current = new Vector3(...(restPosition ?? initialPosition));
    } else if (fallToSurfaceOnRelease) {
      // Switch to dynamic so gravity takes over and the body lands on
      // whatever static collider is below.
      rbRef.current.setBodyType(0 /* Dynamic */, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      isDynamicRef.current = true;
    }

    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }

  // Per-frame: drive kinematic body, run zone detection, dismiss shift hint
  useFrame((_, dt) => {
    if (!rbRef.current) return;

    // Out-of-bounds rescue: if a dropped tool fell off the table and is
    // below floor level, snap it back to its rest position so the user
    // doesn't have to hunt for it under the bench. The threshold is
    // generous (table top is at ~0.80 m, floor at 0 m).
    if (!draggingRef.current && !tweenTargetRef.current) {
      const t = rbRef.current.translation();
      if (t.y < 0.4) {
        const home = restPosition ?? initialPosition;
        rbRef.current.setBodyType(2 /* KinematicPositionBased */, true);
        rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        rbRef.current.setNextKinematicTranslation({
          x: home[0],
          y: home[1],
          z: home[2],
        });
        rbRef.current.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 });
        isDynamicRef.current = false;
      }
    }

    // Tween back to rest (kinematic-driven)
    if (!draggingRef.current && tweenTargetRef.current) {
      const target = tweenTargetRef.current;
      const t = rbRef.current.translation();
      const cur = new Vector3(t.x, t.y, t.z);
      const lerpRate = Math.min(1, dt * 10);
      cur.lerp(target, lerpRate);
      rbRef.current.setNextKinematicTranslation(cur);
      if (cur.distanceTo(target) < 0.001) {
        rbRef.current.setNextKinematicTranslation(target);
        tweenTargetRef.current = null;
        if (currentZoneRef.current && onZoneExit) {
          onZoneExit(currentZoneRef.current);
          currentZoneRef.current = null;
        }
      }
      return;
    }

    if (draggingRef.current) {
      // Push the target translation/rotation into the kinematic body
      if (mode.kind === "translate") {
        rbRef.current.setNextKinematicTranslation(targetPosRef.current);
      } else {
        rbRef.current.setNextKinematicRotation(targetRotRef.current);
      }

      // Zone detection uses the body's ACTUAL world position (after Rapier
      // has resolved any collisions), offset by interactionOffset.
      const t = rbRef.current.translation();
      const r = rbRef.current.rotation();
      const worldPos = new Vector3(t.x, t.y, t.z);
      const delta = new Vector3().subVectors(worldPos, lastFrameWorldRef.current);
      lastFrameWorldRef.current.copy(worldPos);

      let interactionWorld = worldPos;
      if (interactionOffset) {
        const local = new Vector3(...interactionOffset);
        const q = new Quaternion(r.x, r.y, r.z, r.w);
        local.applyQuaternion(q);
        interactionWorld = worldPos.clone().add(local);
      }

      const zoneId = registry.findContaining(interactionWorld, acceptedZones);
      const payload: PointerDelta = {
        worldPos: interactionWorld,
        delta,
        dt,
      };

      if (zoneId !== currentZoneRef.current) {
        if (currentZoneRef.current && onZoneExit) onZoneExit(currentZoneRef.current);
        if (zoneId && onZoneEnter) onZoneEnter(zoneId, payload);
        currentZoneRef.current = zoneId;
      }
      if (zoneId && onZoneTick) onZoneTick(zoneId, payload);
    }
  });

  // Cleanup: ensure cursor reset on unmount
  useEffect(() => {
    return () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        endDrag();
        document.body.style.cursor = "default";
      }
    };
  }, [endDrag]);

  return (
    <RigidBody
      ref={rbRef}
      type="kinematicPosition"
      position={initialPosition}
      colliders={false}
      mass={mass}
      linearDamping={2}
      angularDamping={4}
      ccd
      collisionGroups={PHYS_MASKS.tool}
      restitution={0}
      friction={0.9}
    >
      <CuboidCollider args={collider.args} />
      <group
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (disabled) return;
          setHovered(true);
          document.body.style.cursor = "grab";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          if (!draggingRef.current) document.body.style.cursor = "default";
        }}
      >
        {children}
      </group>
      {hovered && !draggingRef.current && !disabled && (
        <pointLight position={[0, 0.15, 0]} intensity={0.5} distance={0.4} color="#80c0ff" />
      )}
    </RigidBody>
  );
}

void SHIFT_HINT_DISMISS;
