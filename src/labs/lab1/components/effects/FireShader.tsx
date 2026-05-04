"use client";

import { Fire } from "@wolffo/three-fire";
import { useSpring, animated } from "@react-spring/three";

/**
 * Build a procedural grayscale fire-mask PNG (data URL) that the wolffo
 * Fire shader samples to define the flame shape. Brighter near the lower-
 * middle, fading to transparent near the top — exactly the shape of a
 * small upright flame.
 *
 * The wolffo library calls `useLoader(TextureLoader, ...)` unconditionally
 * even when a Texture object is passed (1.3.0 bug), so we MUST pass a
 * string URL. A data URL keeps everything self-contained — no public
 * texture file to ship.
 */
function buildFireMaskDataURL(): string {
  if (typeof document === "undefined") return "";
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(
    size * 0.5,
    size * 0.7,
    0,
    size * 0.5,
    size * 0.5,
    size * 0.55,
  );
  grad.addColorStop(0.0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(220,220,220,0.85)");
  grad.addColorStop(0.7, "rgba(120,120,120,0.5)");
  grad.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return canvas.toDataURL("image/png");
}

let cachedMaskUrl: string | null = null;
function getFireMaskUrl(): string {
  // Only cache once we have a non-empty URL — protects against SSR where
  // `document` is undefined and `buildFireMaskDataURL()` returns "".
  if (cachedMaskUrl) return cachedMaskUrl;
  const url = buildFireMaskDataURL();
  if (url) cachedMaskUrl = url;
  return url;
}

interface FireShaderProps {
  active: boolean;
  position?: [number, number, number];
  /** Vertical extent in metres. */
  height?: number;
  /** Horizontal extent in metres (used for both X and Z). */
  width?: number;
  /** Override flame tint color. Default = warm orange. */
  color?: string;
  /** Magnitude of turbulence — higher = more flickery. */
  magnitude?: number;
}

/**
 * Volumetric fire wrapper around @wolffo/three-fire.
 *
 * - The flame is a true 3D volume (camera-rotation-safe), not a billboard.
 * - `active` smoothly fades the scale (and therefore the visible volume)
 *   over ~0.4s using @react-spring.
 * - We embed a procedural grayscale fire-mask as a data URL so no extra
 *   asset needs to ship with the static export.
 */
export function FireShader({
  active,
  position = [0, 0.05, 0],
  height = 0.18,
  width = 0.08,
  color = "#ff8a30",
  magnitude = 1.2,
}: FireShaderProps) {
  const maskUrl = getFireMaskUrl();

  const { scale } = useSpring({
    scale: active ? 1 : 0.001,
    config: { tension: 180, friction: 24 },
  });

  if (!maskUrl) return null;

  return (
    <animated.group position={position} scale={scale}>
      <Fire
        texture={maskUrl}
        color={color}
        magnitude={magnitude}
        lacunarity={2.3}
        gain={0.7}
        scale={[width, height, width]}
        position={[0, height * 0.5, 0]}
      />
    </animated.group>
  );
}
