"use client";

import { Outlines } from "@react-three/drei";
import type { ReactNode } from "react";

interface HoverHighlightProps {
  show: boolean;
  color?: string;
  thickness?: number;
  children: ReactNode;
}

/**
 * Render a soft outline around children when `show` is true.
 * Uses drei's Outlines component (extends each mesh in the children).
 */
export function HoverHighlight({
  show,
  color = "#80f0ff",
  thickness = 0.02,
  children,
}: HoverHighlightProps) {
  return (
    <group>
      {children}
      {show && <Outlines thickness={thickness} color={color} screenspace transparent opacity={0.85} />}
    </group>
  );
}
