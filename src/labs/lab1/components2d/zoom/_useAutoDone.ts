"use client";

import { useEffect } from "react";

/** Fires `onDone` after `ms` milliseconds. Clean up on unmount. */
export function useAutoDone(onDone: () => void, ms: number) {
  useEffect(() => {
    const t = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(t);
  }, [onDone, ms]);
}
