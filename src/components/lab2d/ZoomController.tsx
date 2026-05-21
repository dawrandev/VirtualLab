"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ZoomViewId =
  | "lamp-ignite"
  | "flame-pass"
  | "culture-sample"
  | "nacl-drop"
  | "smear"
  | "flame-fix"
  | "stain-mb"
  | "wash";

export interface ActiveZoom {
  id: ZoomViewId;
  /** Monotonic key — bumped on each `play()` so repeating the same view restarts the animation. */
  key: number;
}

interface ZoomControllerApi {
  active: ActiveZoom | null;
  play: (id: ZoomViewId) => void;
  /** Called by the active zoom cutscene when its internal animation
   *  finished. Clears `active` so the lens fades out. */
  done: () => void;
  /** Force-clear (used by Заново / reset). */
  clear: () => void;
}

const Ctx = createContext<ZoomControllerApi>({
  active: null,
  play: () => {},
  done: () => {},
  clear: () => {},
});

export function ZoomControllerProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveZoom | null>(null);
  const keyRef = useRef(0);
  const reducedMotion = useReducedMotion();

  const play = useCallback(
    (id: ZoomViewId) => {
      if (reducedMotion) {
        // Show the static frame very briefly so user gets visual confirmation
        // without any motion. Otherwise skip entirely.
        keyRef.current += 1;
        setActive({ id, key: keyRef.current });
        window.setTimeout(() => setActive(null), 350);
        return;
      }
      keyRef.current += 1;
      setActive({ id, key: keyRef.current });
    },
    [reducedMotion],
  );

  const done = useCallback(() => setActive(null), []);
  const clear = useCallback(() => setActive(null), []);

  const value = useMemo<ZoomControllerApi>(
    () => ({ active, play, done, clear }),
    [active, play, done, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useZoomController() {
  return useContext(Ctx);
}

/** Reads the user's reduced-motion preference once on mount (cheap; users
 *  rarely toggle this mid-session). */
function useReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}
