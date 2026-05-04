"use client";

import { Html } from "@react-three/drei";
import { useLabStore } from "@/stores/labStore";

/* ========================================================================
   Shared chip styling — small floating overlay anchored to a tool position.
   All four chips share the same look so they feel like one HUD layer.
   ======================================================================== */

interface ChipProps {
  position?: [number, number, number];
  borderColor: string;
  textColor: string;
  children: React.ReactNode;
}

function Chip({ position = [0, 0.07, 0], borderColor, textColor, children }: ChipProps) {
  return (
    <Html position={position} center distanceFactor={1.2}>
      <div
        style={{
          padding: "5px 11px",
          borderRadius: 8,
          background: "rgba(15,23,42,0.85)",
          border: `1px solid ${borderColor}`,
          color: textColor,
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: "var(--font-inter), sans-serif",
          pointerEvents: "none",
          whiteSpace: "nowrap",
          backdropFilter: "blur(4px)",
          letterSpacing: "0.01em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {children}
      </div>
    </Html>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      style={{
        width: 50,
        height: 4,
        borderRadius: 2,
        background: "rgba(255,255,255,0.12)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.max(0, Math.min(1, value)) * 100}%`,
          height: "100%",
          background: color,
          transition: "width 80ms linear",
        }}
      />
    </div>
  );
}

/* ========================================================================
   FrictionRing — match in strike zone, friction rising
   ======================================================================== */

const FRICTION_THRESHOLD = 0.05;

export function FrictionRing() {
  const friction = useLabStore((s) => s.state.match.frictionDistance);
  const lit = useLabStore((s) => s.state.match.lit);
  const burned = useLabStore((s) => s.state.match.burned);
  if (lit || burned || friction <= 0.001) return null;
  const t = Math.min(1, friction / FRICTION_THRESHOLD);
  return (
    <Chip position={[0.04, 0.05, 0]} borderColor="#fb923c" textColor="#fed7aa">
      <span>Ishqalang!</span>
      <ProgressBar value={t} color="#fb923c" />
    </Chip>
  );
}

/* ========================================================================
   BurnCountdown — match lit, counting down to burnout
   ======================================================================== */

export function BurnCountdown() {
  const lit = useLabStore((s) => s.state.match.lit);
  const burned = useLabStore((s) => s.state.match.burned);
  const left = useLabStore((s) => s.state.match.burnTimeLeft);
  if (!lit || burned) return null;
  const urgent = left < 2;
  const display = Math.max(0, left).toFixed(1);
  return (
    <Chip
      position={[0.04, 0.06, 0]}
      borderColor={urgent ? "#ef4444" : "#fbbf24"}
      textColor={urgent ? "#fecaca" : "#fef3c7"}
    >
      <span style={{ fontSize: 11 }}>⏳</span>
      <span>{display}s</span>
    </Chip>
  );
}

/* ========================================================================
   SterilizationRing — loop in flame, holdMs ramping
   ======================================================================== */

const STERILIZE_TARGET_MS = 3000;

export function SterilizationRing() {
  const holdMs = useLabStore((s) => s.state.sterilization.holdMs);
  const isSterilized = useLabStore((s) => s.state.sterilization.isSterilized);
  if (isSterilized || holdMs <= 1) return null;
  const t = Math.min(1, holdMs / STERILIZE_TARGET_MS);
  const remaining = Math.max(0, (STERILIZE_TARGET_MS - holdMs) / 1000).toFixed(1);
  return (
    <Chip position={[0.05, 0.04, 0]} borderColor="#fb7185" textColor="#fecdd3">
      <span>Sterilizatsiya {remaining}s</span>
      <ProgressBar value={t} color="#fb7185" />
    </Chip>
  );
}

/* ========================================================================
   DryingCountdown — slide drying after fixation
   ======================================================================== */

export function DryingCountdown() {
  const passes = useLabStore((s) => s.state.fixation.passes);
  const isDried = useLabStore((s) => s.state.fixation.isDried);
  const left = useLabStore((s) => s.state.fixation.dryingTimeLeft);
  if (passes < 3 || isDried || left <= 0) return null;
  return (
    <Chip position={[0, 0.05, 0]} borderColor="#94a3b8" textColor="#e2e8f0">
      <span style={{ fontSize: 11 }}>♨</span>
      <span>Quritilmoqda {left.toFixed(1)}s</span>
    </Chip>
  );
}

/* ========================================================================
   StainingChip — dye applied, maturing toward use
   ======================================================================== */

export function StainingChip() {
  const dyeApplied = useLabStore((s) => s.state.dye.applied);
  const dyeMatured = useLabStore((s) => s.state.dye.matured);
  const left = useLabStore((s) => s.state.dye.timeLeft);
  if (!dyeApplied || dyeMatured) return null;
  return (
    <Chip position={[0, 0.05, 0]} borderColor="#cc55ff" textColor="#e9d5ff">
      <span>Bo'yoq ta'sir {left.toFixed(1)}s</span>
    </Chip>
  );
}
