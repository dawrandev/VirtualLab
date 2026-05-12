"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { StainBase } from "./_StainBase";

export default function StainLugolZoom(props: ZoomViewProps) {
  return <StainBase {...props} variant="lugol" color="#a26b1f" label="2) Lyugol" ms={1400} />;
}
