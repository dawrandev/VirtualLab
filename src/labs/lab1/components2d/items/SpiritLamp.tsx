"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Flame } from "../animations/Flame";
import { Smoke } from "../animations/Smoke";

interface Props {
  uncapped: boolean;
  lit: boolean;
  /** Makes the cap clickable (bench only): opens a capped lamp, re-caps an
   *  open one — re-capping a burning lamp smothers the flame. */
  onCapClick?: () => void;
  /** Learn-mode cue: the cap is the next thing to use (pulsing outline). */
  capHint?: boolean;
  /** Tooltip for the clickable cap. */
  capTitle?: string;
}

/** Cap travel: lifted straight off the neck, then arced over to rest tilted on
 *  the dish rim — and the same path back when it is put on again. */
const CAP_VARIANTS: Variants = {
  open: {
    x: [0, 4, 60],
    y: [0, -46, 70],
    rotate: [0, -10, 20],
    transition: { duration: 0.75, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] },
  },
  closed: {
    x: [60, 26, 0, 0],
    y: [70, -42, 3, 0],
    rotate: [20, -8, 0, 0],
    transition: { duration: 0.7, times: [0, 0.55, 0.88, 1], ease: ["easeOut", "easeIn", "easeOut"] },
  },
};
/** When the descending cap reaches the wick and snuffs the flame (ms). */
const SNUFF_DELAY_MS = 560;
const SMOKE_MS = 1900;

/**
 * Glass spirit lamp (спиртовка) standing INSIDE an open glass holder dish.
 * The dish is a shallow hollow bowl; the squat alcohol reservoir sits down in
 * it. A frayed gauze/cotton wick (bint) pokes from the ridged neck — charred
 * at the tip when lit — and a real flame burns above it with a warm glow halo.
 * The silver cap is lifted off by hand before lighting and put back on to put
 * the flame out (the flame dies when the cap lands, then a wisp of smoke).
 */
export function SpiritLamp({ uncapped, lit, onCapClick, capHint, capTitle }: Props) {
  // The flame keeps burning until the descending cap actually covers the wick.
  const [flameOn, setFlameOn] = useState(lit);
  const [smoking, setSmoking] = useState(false);
  const wasLit = useRef(lit);
  const uncappedRef = useRef(uncapped);
  uncappedRef.current = uncapped;
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (lit === wasLit.current) return;
    wasLit.current = lit;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (lit) {
      setFlameOn(true);
      setSmoking(false);
      return;
    }
    // Put out by the cap → wait for it to land; otherwise (e.g. reset) at once.
    const delay = uncappedRef.current ? 0 : SNUFF_DELAY_MS;
    timers.current.push(
      window.setTimeout(() => {
        setFlameOn(false);
        setSmoking(true);
      }, delay),
      window.setTimeout(() => setSmoking(false), delay + SMOKE_MS),
    );
  }, [lit]);
  useEffect(() => {
    const t = timers;
    return () => t.current.forEach((id) => window.clearTimeout(id));
  }, []);

  // The wick stays drawn while the flame burns (the landing cap covers it).
  const wickVisible = uncapped || flameOn;
  const interactive = !!onCapClick;
  return (
    <div style={{ position: "relative", width: 160, height: 200 }}>
      {/* Warm glow halo behind the flame */}
      {flameOn && (
        <motion.div
          aria-hidden
          animate={{ opacity: [0.45, 0.7, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: 80 - 34,
            top: -8,
            width: 68,
            height: 96,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,170,40,0.65) 0%, rgba(255,120,20,0.25) 45%, rgba(255,120,20,0) 70%)",
            pointerEvents: "none",
            filter: "blur(2px)",
          }}
        />
      )}

      {/* Flame above the wick */}
      <div style={{ position: "absolute", left: 80 - 22, top: 0, width: 44, height: 86, pointerEvents: "none" }}>
        <AnimatePresence>
          {flameOn && (
            <motion.div
              key="lamp-flame"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              style={{ originY: 1 }}
            >
              <Flame width={44} height={86} intensity={1} preset="lamp" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <svg width="160" height="200" viewBox="0 0 160 200" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id="lampGlass2" cx="38%" cy="35%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#e6f1f4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#bcd3da" stopOpacity="0.65" />
          </radialGradient>
          <linearGradient id="lampAlc" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eef6f8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#cfe0e6" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="dishWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#eef6f8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c2d6dd" stopOpacity="0.62" />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse cx="80" cy="192" rx="60" ry="9" fill="#000" opacity="0.16" />

        {/* --- Open glass holder dish (back rim + hollow interior) --- */}
        <ellipse cx="80" cy="150" rx="66" ry="16" fill="url(#lampGlass2)" stroke="#9db8c0" strokeWidth="1.3" />
        {/* Hollow inside — darker recessed ring + lighter floor */}
        <ellipse cx="80" cy="150" rx="57" ry="12.5" fill="#9fbcc5" opacity="0.4" />
        <ellipse cx="80" cy="152" rx="48" ry="9.5" fill="#eef6f8" opacity="0.65" />

        {/* --- Reservoir sitting DOWN inside the dish --- */}
        <path
          d="M46 162 Q40 162 40 150 L40 122 Q40 100 80 100 Q120 100 120 122 L120 150 Q120 162 114 162 Z"
          fill="url(#lampGlass2)"
          stroke="#9db8c0"
          strokeWidth="1.4"
        />
        {/* Alcohol level */}
        <path d="M46 162 Q40 162 40 150 L40 138 L120 138 L120 150 Q120 162 114 162 Z" fill="url(#lampAlc)" />
        {/* Glass ridges */}
        <path d="M44 116 H116 M42 126 H118 M44 136 H116" stroke="#bcd3da" strokeWidth="0.8" opacity="0.7" />
        {/* Body highlight */}
        <ellipse cx="58" cy="120" rx="9" ry="15" fill="#ffffff" opacity="0.5" />

        {/* --- Dish FRONT wall (drawn over the reservoir base → seated inside) --- */}
        <path
          d="M14 150 Q14 178 32 184 Q80 195 128 184 Q146 178 146 150 Q146 163 80 167 Q14 163 14 150 Z"
          fill="url(#dishWall)"
          stroke="#9db8c0"
          strokeWidth="1.3"
        />
        {/* Front rim highlight */}
        <path d="M22 158 Q80 170 138 158" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.5" />

        {/* Ridged neck / collar */}
        <rect x="66" y="82" width="28" height="18" rx="2" fill="url(#lampGlass2)" stroke="#9db8c0" strokeWidth="1.2" />
        <path d="M66 87 H94 M66 92 H94" stroke="#bcd3da" strokeWidth="0.7" opacity="0.8" />

        {/* Gauze / cotton wick (bint), charred at the tip when lit */}
        {wickVisible && (
          <g>
            <path
              d="M71 84 Q70 66 74 56 Q78 48 80 46 Q82 48 86 56 Q90 66 89 84 Z"
              fill={flameOn ? "#7c6a55" : "#e8dcc4"}
              stroke="#b9a983"
              strokeWidth="0.8"
            />
            <path
              d="M74 82 Q73 66 78 52 M80 82 Q80 64 80 48 M86 82 Q87 66 82 52"
              stroke={flameOn ? "#5a4a38" : "#cdbf9e"}
              strokeWidth="0.7"
              fill="none"
            />
            <ellipse cx="80" cy="48" rx="7" ry="4" fill={flameOn ? "#2a1d12" : "#a98e63"} />
            {flameOn && <ellipse cx="80" cy="47" rx="4" ry="2.2" fill="#1a120b" />}
          </g>
        )}
      </svg>

      {/* Wisp of smoke escaping from under the cap right after it is put out */}
      <AnimatePresence>
        {smoking && (
          <motion.div
            key="snuff-smoke"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{ position: "absolute", left: 80, top: -36, pointerEvents: "none" }}
          >
            <Smoke active count={5} color="#9ca3af" size={11} width={30} height={78} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detachable silver dome cap — lifted off by hand before lighting and
          put back on to smother the flame. */}
      <motion.div
        initial={false}
        variants={CAP_VARIANTS}
        animate={uncapped ? "open" : "closed"}
        onPointerDown={interactive ? (e) => e.stopPropagation() : undefined}
        onClick={
          interactive
            ? (e) => {
                e.stopPropagation();
                onCapClick?.();
              }
            : undefined
        }
        title={interactive ? capTitle : undefined}
        role={interactive ? "button" : undefined}
        aria-label={interactive ? capTitle : undefined}
        style={{ position: "absolute", left: 60, top: 38, width: 40, height: 56, cursor: interactive ? "pointer" : undefined, zIndex: 2 }}
      >
        {interactive && capHint && (
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-xl"
            style={{ inset: -8, border: "2px dashed #0ea5a0", boxShadow: "0 0 14px rgba(13,148,160,0.45)", animation: "wbZonePulse 1.4s ease-in-out infinite" }}
          />
        )}
        <motion.div
          whileHover={interactive ? { scale: 1.1, y: -2 } : undefined}
          whileTap={interactive ? { scale: 0.94 } : undefined}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <svg width="40" height="56" viewBox="0 0 40 56" style={{ display: "block" }}>
            <defs>
              <linearGradient id="capBody2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c878f" />
                <stop offset="30%" stopColor="#e8eef1" />
                <stop offset="55%" stopColor="#bcc6cc" />
                <stop offset="100%" stopColor="#6c757d" />
              </linearGradient>
            </defs>
            <path d="M4 18 C4 2 36 2 36 18 L36 44 L4 44 Z" fill="url(#capBody2)" stroke="#5b6770" strokeWidth="1.2" />
            <ellipse cx="14" cy="14" rx="3" ry="9" fill="#ffffff" opacity="0.65" />
            <rect x="0" y="42" width="40" height="6" rx="2" fill="#5b6770" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}
