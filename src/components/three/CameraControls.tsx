"use client";

import { OrbitControls } from "@react-three/drei";
import { useLabStore } from "@/stores/labStore";

/**
 * Wrapper around drei's OrbitControls that disables itself while a tool is
 * being dragged. Without this, dragging a tool also rotates the camera and
 * the user can't actually interact with anything.
 */
export function CameraControls() {
  const isDragging = useLabStore((s) => s.state.draggedToolId !== null);
  return (
    <OrbitControls
      enabled={!isDragging}
      target={[0, 0.95, 0]}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2.05}
      minDistance={0.9}
      maxDistance={2.6}
      enablePan={false}
      rotateSpeed={0.45}
      zoomSpeed={0.7}
    />
  );
}
