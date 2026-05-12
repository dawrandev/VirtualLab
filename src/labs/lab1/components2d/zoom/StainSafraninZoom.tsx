"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { StainBase } from "./_StainBase";

export default function StainSafraninZoom(props: ZoomViewProps) {
  return <StainBase {...props} variant="safranin" color="#cc3a55" label="4) Safranin" ms={1600} />;
}
