"use client";

import { useEffect, useState } from "react";

/** Toggles from "pre" to "post" after `ms` milliseconds. Used by cutscenes
 *  to show the BEFORE state first, then transition to AFTER. */
export function usePhase(ms: number): "pre" | "post" {
  const [phase, setPhase] = useState<"pre" | "post">("pre");
  useEffect(() => {
    const t = window.setTimeout(() => setPhase("post"), ms);
    return () => window.clearTimeout(t);
  }, [ms]);
  return phase;
}
