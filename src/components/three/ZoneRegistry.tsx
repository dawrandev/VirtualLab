"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Vector3 } from "three";
import type { ZoneId } from "@/engine/types";

export type ZoneShape =
  | { kind: "sphere"; center: Vector3; radius: number }
  | { kind: "box"; min: Vector3; max: Vector3 };

export interface ZoneEntry {
  id: ZoneId;
  shape: ZoneShape;
}

interface ZoneRegistryApi {
  register(entry: ZoneEntry): () => void;
  /** Returns the first zone id whose shape contains `worldPos`, or null.
   * If `allowed` is provided, only zones in that list are considered. */
  findContaining(worldPos: Vector3, allowed?: readonly ZoneId[]): ZoneId | null;
  /** Whether a specific zone contains `worldPos`. */
  contains(zoneId: ZoneId, worldPos: Vector3): boolean;
}

const ZoneRegistryContext = createContext<ZoneRegistryApi | null>(null);

function pointInShape(pos: Vector3, shape: ZoneShape): boolean {
  if (shape.kind === "sphere") {
    return pos.distanceTo(shape.center) <= shape.radius;
  }
  return (
    pos.x >= shape.min.x &&
    pos.x <= shape.max.x &&
    pos.y >= shape.min.y &&
    pos.y <= shape.max.y &&
    pos.z >= shape.min.z &&
    pos.z <= shape.max.z
  );
}

export function ZoneRegistryProvider({ children }: { children: ReactNode }) {
  const zonesRef = useRef<Map<ZoneId, ZoneShape>>(new Map());

  const register = useCallback((entry: ZoneEntry) => {
    zonesRef.current.set(entry.id, entry.shape);
    return () => {
      zonesRef.current.delete(entry.id);
    };
  }, []);

  const findContaining = useCallback(
    (worldPos: Vector3, allowed?: readonly ZoneId[]): ZoneId | null => {
      // If a filter list is given, iterate it in order so the caller controls
      // priority for overlapping zones (e.g. slide-dye vs slide-area).
      if (allowed) {
        for (const id of allowed) {
          const shape = zonesRef.current.get(id);
          if (shape && pointInShape(worldPos, shape)) return id;
        }
        return null;
      }
      for (const [id, shape] of zonesRef.current) {
        if (pointInShape(worldPos, shape)) return id;
      }
      return null;
    },
    [],
  );

  const contains = useCallback((zoneId: ZoneId, worldPos: Vector3): boolean => {
    const shape = zonesRef.current.get(zoneId);
    if (!shape) return false;
    return pointInShape(worldPos, shape);
  }, []);

  const api = useMemo<ZoneRegistryApi>(
    () => ({ register, findContaining, contains }),
    [register, findContaining, contains],
  );

  return (
    <ZoneRegistryContext.Provider value={api}>{children}</ZoneRegistryContext.Provider>
  );
}

export function useZoneRegistry(): ZoneRegistryApi {
  const ctx = useContext(ZoneRegistryContext);
  if (!ctx) {
    throw new Error("useZoneRegistry must be used inside <ZoneRegistryProvider>");
  }
  return ctx;
}
