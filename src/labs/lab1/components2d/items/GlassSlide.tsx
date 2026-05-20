"use client";

// The cartoon glass slide has been replaced by `RealisticSlide` which uses
// the same prop shape. We keep a stable export name so existing call sites
// don't need to change.
export { RealisticSlide as GlassSlide } from "./RealisticSlide";
