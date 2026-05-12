"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  /** When false, particles fade out. */
  active: boolean;
  count?: number;
  /** Color tier. Grey for smoke, white for steam, blue-white for vapor. */
  color?: string;
  /** Pixel diameter for each particle. */
  size?: number;
  /** Total spread width. */
  width?: number;
  /** Travel height. */
  height?: number;
}

/**
 * Continuous rising particles for smoke (above flames) or steam (above
 * drying slides). Simple looping motion with random offsets — no canvas.
 */
export function Smoke({
  active,
  count = 6,
  color = "#bbbbbb",
  size = 14,
  width = 40,
  height = 110,
}: Props) {
  const [seed] = useState(() => Math.random());
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute" style={{ width, height, transform: "translateX(-50%)" }}>
      {Array.from({ length: count }).map((_, i) => {
        const delay = (i / count) * 2.4 + seed * 0.3;
        const dx = (Math.sin((i + seed * 7) * 11) * width) / 3;
        const initialOpacity = 0.55;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: dx, y: height, scale: 0.5 }}
            animate={{
              opacity: [0, initialOpacity, 0],
              y: [height, height / 2, -10],
              x: [dx, dx + (Math.cos(i + seed * 5) * 14), dx + (Math.sin(i + seed * 4) * 20)],
              scale: [0.5, 1.05, 1.4],
            }}
            transition={{
              duration: 2.4,
              delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
            style={{
              position: "absolute",
              left: width / 2 - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              filter: "blur(3px)",
            }}
          />
        );
      })}
    </div>
  );
}
