"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { StainBase } from "./_StainBase";

/** Methylene blue staining cutscene (the only stain in a simple stain). */
export default function StainMbZoom(props: ZoomViewProps) {
  return <StainBase {...props} color="#2742b8" label="Metilen ko'ki" ms={1600} />;
}
