"use client";

import type { ZoomViewProps } from "@/components/lab2d/ZoomLens";
import { StainBase } from "./_StainBase";

export default function StainCvZoom(props: ZoomViewProps) {
  return <StainBase {...props} variant="cv" color="#5b2e8c" label="1) Gentsian-binafsha" ms={1600} />;
}
