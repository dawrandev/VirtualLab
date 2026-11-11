/**
 * Shared exam grading for the spirit lamp's last step: once the flame work is
 * finished, the student puts the cap back on to put the lamp out.
 *
 *  - full    — lit, and capped AFTER the last action that needed the flame;
 *  - partial — capped, but before the flame work was finished;
 *  - zero    — never lit, or left burning at the end.
 */

export interface LampLogEntry {
  intent: string;
  ts: number;
}

export interface LampOutGrade {
  status: "full" | "partial" | "zero";
  notes: string[];
}

export const LAMP_OUT_STEP_ID = "lamp-out";

export function gradeLampOut(log: LampLogEntry[], litAtEnd: boolean, flameIntents: readonly string[]): LampOutGrade {
  if (!log.some((a) => a.intent === "light-lamp")) return { status: "zero", notes: ["spiritLamp.score.notLit"] };
  if (litAtEnd) return { status: "zero", notes: ["spiritLamp.score.notExtinguished"] };

  let lastOut = -Infinity;
  let lastFlame = -Infinity;
  for (const a of log) {
    if (a.intent === "extinguish-lamp") lastOut = Math.max(lastOut, a.ts);
    if (flameIntents.includes(a.intent)) lastFlame = Math.max(lastFlame, a.ts);
  }
  if (lastOut === -Infinity) return { status: "zero", notes: ["spiritLamp.score.notExtinguished"] };
  return lastOut >= lastFlame ? { status: "full", notes: [] } : { status: "partial", notes: ["spiritLamp.score.early"] };
}
