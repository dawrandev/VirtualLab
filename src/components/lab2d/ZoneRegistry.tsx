"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AABB, ZoneId } from "@/engine2d/types";

export interface RegisteredZone {
  id: ZoneId;
  rect: AABB;
}

interface RegistryState {
  zones: RegisteredZone[];
  register: (z: RegisteredZone) => void;
  unregister: (id: ZoneId) => void;
}

const Ctx = createContext<RegistryState>({
  zones: [],
  register: () => {},
  unregister: () => {},
});

export function ZoneRegistryProvider({ children }: { children: ReactNode }) {
  const [zones, setZones] = useState<RegisteredZone[]>([]);
  const register = useCallback((z: RegisteredZone) => {
    setZones((prev) => {
      const others = prev.filter((p) => p.id !== z.id);
      return [...others, z];
    });
  }, []);
  const unregister = useCallback((id: ZoneId) => {
    setZones((prev) => prev.filter((p) => p.id !== id));
  }, []);
  const value = useMemo(() => ({ zones, register, unregister }), [zones, register, unregister]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useZoneRegistry() {
  return useContext(Ctx);
}

/** Returns the topmost (last-registered) zone containing `pt`, or null. */
export function findZoneAt(zones: RegisteredZone[], pt: { x: number; y: number }): RegisteredZone | null {
  for (let i = zones.length - 1; i >= 0; i--) {
    const r = zones[i].rect;
    if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) return zones[i];
  }
  return null;
}

interface ZoneProps {
  id: ZoneId;
  rect: AABB;
  debug?: boolean;
  debugColor?: string;
}

/** Registers a zone with the parent registry. Renders nothing unless debug. */
export function Zone({ id, rect, debug, debugColor = "#ff5566" }: ZoneProps) {
  const { register, unregister } = useZoneRegistry();
  useEffect(() => {
    register({ id, rect });
    return () => unregister(id);
  }, [id, rect.x, rect.y, rect.w, rect.h, register, unregister]);
  if (!debug) return null;
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        border: `2px dashed ${debugColor}`,
        background: `${debugColor}22`,
      }}
    >
      <div className="absolute -top-5 left-0 text-[10px] font-mono" style={{ color: debugColor }}>
        {id}
      </div>
    </div>
  );
}
