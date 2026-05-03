"use client";

import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Group, Object3D, Plane, Raycaster, Vector2, Vector3 } from "three";
import type { ToolId, ZoneId } from "@/engine/types";
import { useLabStore } from "@/stores/labStore";
import { useZoneRegistry } from "./ZoneRegistry";

export type DragMode =
  | { kind: "translate"; planeY?: number }
  | { kind: "rotate"; axis: "x" | "y" | "z"; sensitivity?: number };

interface PointerDelta {
  /** World-space pointer position this frame. */
  worldPos: Vector3;
  /** World-space pointer delta from previous frame. */
  delta: Vector3;
  /** Frame time in seconds. */
  dt: number;
}

interface Draggable3DProps {
  toolId: ToolId;
  initialPosition: [number, number, number];
  /** Drag behaviour. Default = translate on the table plane (y=initialPosition[1]). */
  mode?: DragMode;
  /** Local-space offset from the group origin to the tool's "interaction
   * point" (e.g. loop ring tip, pipette nozzle). Zones are queried using
   * this point instead of the group origin so that the visible tip drives
   * the interaction, not the user's invisible grip. The offset is
   * transformed by the group's full local matrix so rotation is respected. */
  interactionOffset?: [number, number, number];
  /** If provided, only these zones are considered when resolving the
   * tool's current zone. Lets each tool pick its own zone priority — e.g.
   * a dye pipette only looks for `slide-dye`, ignoring the overlapping
   * `slide-area` zone used by the loop's smear gesture. */
  acceptedZones?: readonly ZoneId[];
  /** Callback fired each frame while inside any zone (and dragged). */
  onZoneTick?: (zoneId: ZoneId, payload: PointerDelta) => void;
  /** Callback fired the first frame the tool enters a zone. */
  onZoneEnter?: (zoneId: ZoneId, payload: PointerDelta) => void;
  /** Callback fired the frame the tool leaves a zone. */
  onZoneExit?: (zoneId: ZoneId) => void;
  /** Callback fired on pointer-up if currently inside a zone. */
  onDrop?: (zoneId: ZoneId, payload: PointerDelta) => void;
  /** Disable the tool entirely (greyed-out, ignores pointer). */
  disabled?: boolean;
  /** Position to snap back to on release if `returnToRestOnRelease` returns true.
   * Defaults to `initialPosition`. */
  restPosition?: [number, number, number];
  /** If returns true on release, the group tween-snaps back to restPosition.
   * Receives the zoneId at moment of release (or null if released in empty space). */
  returnToRestOnRelease?: (zoneId: ZoneId | null) => boolean;
  /** When true: on release, raycast straight down from the tool's world
   * position and tween Y to land on the first surface hit (or `tableY` if
   * nothing). Mutually exclusive with returnToRestOnRelease. */
  fallToSurfaceOnRelease?: boolean;
  /** Y of the lab table top (default 0.81). */
  tableY?: number;
  /** Vertical offset above the surface when settling (default 0.005). */
  settleOffset?: number;
  children: ReactNode;
}

/**
 * Pointer-based 3D drag controller. While dragging, sets
 * labStore.draggedToolId so the camera controls disable themselves.
 *
 * Translation mode: ray-casts pointer onto a horizontal plane at planeY
 * (default = initial Y). Rotation mode: maps horizontal pointer delta to
 * angular delta on the chosen axis.
 *
 * Each frame, the world position of the wrapped group is queried against
 * the ZoneRegistry. Zone enter/exit/tick callbacks fire accordingly.
 *
 * On pointer-up, if currently inside a zone, onDrop fires.
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
  tableY = 0.81,
  settleOffset = 0.005,
  children,
}: Draggable3DProps) {
  const groupRef = useRef<Group>(null!);
  const draggingRef = useRef(false);
  const lastPointerWorldRef = useRef(new Vector3());
  const lastFrameWorldRef = useRef(new Vector3());
  const currentZoneRef = useRef<ZoneId | null>(null);
  const [hovered, setHovered] = useState(false);
  const tweenTargetRef = useRef<Vector3 | null>(null);

  const { gl, camera, scene } = useThree();
  const registry = useZoneRegistry();
  const startDrag = useLabStore((s) => s.startDrag);
  const endDrag = useLabStore((s) => s.endDrag);

  const raycaster = useRef(new Raycaster());
  const ndc = useRef(new Vector2());
  const dragPlane = useRef(
    new Plane(
      new Vector3(0, 1, 0),
      -(mode.kind === "translate" ? mode.planeY ?? initialPosition[1] : initialPosition[1]),
    ),
  );
  const intersect = useRef(new Vector3());

  // Pointer-down on any descendant
  function pointerDown(e: ThreeEvent<PointerEvent>) {
    if (disabled) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    draggingRef.current = true;
    startDrag(toolId);
    document.body.style.cursor = "grabbing";

    // Initial pointer projection
    const rect = (gl.domElement as HTMLCanvasElement).getBoundingClientRect();
    ndc.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(ndc.current, camera);
    if (raycaster.current.ray.intersectPlane(dragPlane.current, intersect.current)) {
      lastPointerWorldRef.current.copy(intersect.current);
      lastFrameWorldRef.current.copy(groupRef.current.position);
      // Cancel any in-flight rest-tween — user just grabbed the tool again.
      tweenTargetRef.current = null;
    }
  }

  function pointerMove(e: ThreeEvent<PointerEvent>) {
    if (disabled || !draggingRef.current) return;
    e.stopPropagation();
    const rect = (gl.domElement as HTMLCanvasElement).getBoundingClientRect();
    ndc.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    ndc.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(ndc.current, camera);
    if (raycaster.current.ray.intersectPlane(dragPlane.current, intersect.current)) {
      if (mode.kind === "translate") {
        // Tool follows the cursor's projection onto the drag plane. Drag plane
        // Y is kept close to the tool's rest height so there's no visible jump
        // on pickup; zones are configured as tall columns to still capture
        // interactions over the lamp/flame.
        groupRef.current.position.copy(intersect.current);
      } else {
        // Rotate based on pointer delta along world X axis
        const sens = mode.sensitivity ?? 6;
        const dx = intersect.current.x - lastPointerWorldRef.current.x;
        const ang = dx * sens;
        if (mode.axis === "x") groupRef.current.rotation.x += ang;
        else if (mode.axis === "y") groupRef.current.rotation.y += ang;
        else groupRef.current.rotation.z += ang;
      }
      lastPointerWorldRef.current.copy(intersect.current);
    }
  }

  function pointerUp(e: ThreeEvent<PointerEvent>) {
    if (disabled) return;
    e.stopPropagation();
    if (draggingRef.current) {
      draggingRef.current = false;
      endDrag();
      document.body.style.cursor = "default";
      const worldPos = new Vector3();
      groupRef.current.getWorldPosition(worldPos);
      const zone = currentZoneRef.current;
      // Drop event — fire if inside a zone
      if (zone && onDrop) {
        onDrop(zone, { worldPos, delta: new Vector3(), dt: 0 });
      }
      // Decide what happens to the dropped tool
      if (returnToRestOnRelease && returnToRestOnRelease(zone)) {
        tweenTargetRef.current = new Vector3(...(restPosition ?? initialPosition));
      } else if (fallToSurfaceOnRelease) {
        // Cast a ray straight down from the current tool position; settle
        // the group on the first solid surface (matchbox, lamp, table, ...).
        const downRay = new Raycaster(
          worldPos.clone().add(new Vector3(0, 0.01, 0)),
          new Vector3(0, -1, 0),
          0,
          5,
        );
        // Filter out our own group's children so the tool doesn't intersect itself.
        const candidates: Object3D[] = [];
        scene.traverse((obj) => {
          if (obj === groupRef.current) return;
          let p: Object3D | null = obj.parent;
          while (p) {
            if (p === groupRef.current) return;
            p = p.parent;
          }
          candidates.push(obj);
        });
        const hits = downRay.intersectObjects(candidates, false);
        const firstHit = hits.find((h) => h.distance > 0.001);
        const surfaceY = firstHit ? firstHit.point.y : tableY;
        const targetY = surfaceY + settleOffset;
        tweenTargetRef.current = new Vector3(worldPos.x, targetY, worldPos.z);
      }
    }
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  }

  // Per-frame: zone detection + tick + return-to-rest tween
  useFrame((_, dt) => {
    if (!groupRef.current) return;

    // Tween back to rest position (after release)
    if (!draggingRef.current && tweenTargetRef.current) {
      const target = tweenTargetRef.current;
      const cur = groupRef.current.position;
      const lerpRate = Math.min(1, dt * 10);
      cur.lerp(target, lerpRate);
      if (cur.distanceTo(target) < 0.001) {
        cur.copy(target);
        tweenTargetRef.current = null;
        // Fire one final exit if we were in a zone before tween started
        if (currentZoneRef.current && onZoneExit) {
          onZoneExit(currentZoneRef.current);
          currentZoneRef.current = null;
        }
      }
      return;
    }

    const worldPos = new Vector3();
    groupRef.current.getWorldPosition(worldPos);

    if (draggingRef.current) {
      const delta = new Vector3().subVectors(worldPos, lastFrameWorldRef.current);
      lastFrameWorldRef.current.copy(worldPos);

      // Compute the interaction point in world space (default = group origin).
      let interactionWorld = worldPos;
      if (interactionOffset) {
        const local = new Vector3(...interactionOffset);
        interactionWorld = local.applyMatrix4(groupRef.current.matrixWorld);
      }

      const zoneId = registry.findContaining(interactionWorld, acceptedZones);
      const payload: PointerDelta = { worldPos: interactionWorld, delta, dt };

      if (zoneId !== currentZoneRef.current) {
        if (currentZoneRef.current && onZoneExit) onZoneExit(currentZoneRef.current);
        if (zoneId && onZoneEnter) onZoneEnter(zoneId, payload);
        currentZoneRef.current = zoneId;
      }
      if (zoneId && onZoneTick) onZoneTick(zoneId, payload);
    }
  });

  // On unmount or disable, ensure cursor reset
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
    <group
      ref={groupRef}
      position={initialPosition}
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
      {hovered && !draggingRef.current && !disabled && (
        <pointLight position={[0, 0.15, 0]} intensity={0.5} distance={0.4} color="#80c0ff" />
      )}
    </group>
  );
}
