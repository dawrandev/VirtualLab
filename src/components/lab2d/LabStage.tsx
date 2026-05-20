"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Stage with a fixed virtual coordinate system of 1280×720 (matching the
 * reference video's resolution). It scales uniformly to the viewport so any
 * children that position by px-coords inside it stay aligned across screen
 * sizes. The bottom-most child sits below the sidebar (88px) and topbar
 * (56px); the inner stage occupies 1192 × 664 of virtual pixels.
 */
export const STAGE_WIDTH = 1280;
export const STAGE_HEIGHT = 720;
export const SIDEBAR_WIDTH = 96;
export const TOPBAR_HEIGHT = 56;
export const INNER_W = STAGE_WIDTH - SIDEBAR_WIDTH;
export const INNER_H = STAGE_HEIGHT - TOPBAR_HEIGHT;

export function LabStage({ children }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function fit() {
      const el = wrapRef.current;
      if (!el) return;
      const parent = el.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      const s = Math.min(w / STAGE_WIDTH, h / STAGE_HEIGHT);
      setScale(s);
    }
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div ref={wrapRef} className="absolute inset-0 flex items-center justify-center">
      <div
        data-stage-root
        style={{
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: SIDEBAR_WIDTH,
            top: TOPBAR_HEIGHT,
            width: INNER_W,
            height: INNER_H,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
