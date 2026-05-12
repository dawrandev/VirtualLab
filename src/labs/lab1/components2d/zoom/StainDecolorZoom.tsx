"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { StainBase } from "./_StainBase";

export default function StainDecolorZoom(props: ZoomViewProps) {
  return <StainBase {...props} variant="decolor" color="#e6edf1" label="3) 96% etanol" ms={1200} />;
}
