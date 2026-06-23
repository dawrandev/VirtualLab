"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLab2DStore } from "@/stores/labStore2d";
import type { Lab2DState, StepId } from "@/engine2d/types";
import config from "../config2d";
import { Lab1ResultModal } from "../components2d/Lab1ResultModal";
import { Drop } from "../components2d/animations/Drop";
import { BacterialLoop } from "../components2d/items/BacterialLoop";
import { TestTubeRack } from "../components2d/items/TestTubeRack";
import { LoopStand } from "../components2d/items/LoopStand";
import { ToolSidebar } from "./ToolSidebar";
import { ModeSelect } from "./ModeSelect";
import { PlanningSidebar } from "./PlanningSidebar";
import { ExamResultModal } from "../components2d/ExamResultModal";
import { HourglassWait } from "@/components/HourglassWait";
import type { ExamAction, ExamPhase, LabMode } from "../exam/protocol";
import { scoreExam, type ExamResult } from "../exam/scoring";
import { ITEMS, ITEM_BY_ID, intentFor, type ItemId } from "./items";

const DROP_PAD = 26;
const TICK = 70;
const HOLD_DUR = 1400; // sterilize / fix
const SAMPLE_DUR = 1900; // loop into tube
const AIRDRY_DUR = 12000; // hold slide in the air
const RUB_K = 0.0016; // rub progress per px moved
const GHOST_SCALE = 1.06; // matches the drag-ghost CSS scale

type Kind = "rub" | "hold" | "sample" | "airdry" | "instant" | "contact";

interface DragState {
  id: ItemId;
  fromSidebar: boolean;
  px: number;
  py: number;
}
interface Hold {
  kind: Kind;
  target: ItemId | "air";
  intent: StepId;
  progress: number;
}
interface Fx {
  kind: "check" | "drop-nacl" | "drop-mb" | "drop-oil" | "wash" | "blot";
  x: number;
  y: number;
  key: number;
}

/** What kind of interaction a (tool → target) pair is. */
function actionKind(tool: ItemId, target: ItemId): Kind {
  if (tool === "match" && target === "matchbox") return "rub"; // strike
  if (tool === "alcohol-pad" && target === "slide") return "rub"; // wipe clean
  if (tool === "loop" && target === "slide") return "rub"; // smear
  if (tool === "filter" && target === "slide") return "contact"; // blot — press on top, no rubbing
  if (tool === "loop" && target === "lamp") return "hold"; // sterilize (vertical + horizontal)
  if (tool === "match" && target === "lamp") return "contact"; // light lamp — stays in hand
  if (tool === "slide" && target === "lamp") return "contact"; // fix: pass over the flame ×3
  if (tool === "loop" && (target === "culture" || target === "petri")) return "sample"; // insert / touch a colony
  return "instant";
}

function nextHint(s: Lab2DState): string {
  switch (s.currentStageId) {
    case "stage-1":
      if (!s.match.struck) return "lab1.hint.strikeMatch";
      if (!s.lamp.lit) return "lab1.hint.lightLamp";
      if (!s.trash.match) return "lab1.hint.discardMatch";
      return "lab1.hint.stageReady";
    case "stage-2":
      // Slide is prepared FIRST (clean + NaCl), then the loop is sterilized
      // right before it is used — so it is freshly sterile when sampling.
      if (!s.slide.onRack) return "lab1.hint.slideOnBridge";
      if (!s.slide.cleaned) return "lab1.hint.cleanSlide";
      if (!s.slide.naclApplied) return "lab1.hint.applyNacl";
      if (s.loop.sterilizePasses < 3) return "lab1.hint.sterilizeLoop";
      if (!s.loop.carriesSample) return "lab1.hint.takeSample";
      if (!s.slide.smeared) return "lab1.hint.smear";
      if (!s.loop.resterilized) return "lab1.hint.resterilize";
      return "lab1.hint.stageReady";
    case "stage-3":
      if (!s.slide.airDried) return "lab1.hint.airDry";
      if (s.slide.fixPasses < 3) return "lab1.hint.fix";
      return "lab1.hint.stageReady";
    case "stage-4":
      if (!s.slide.methyleneBlue.applied) return "lab1.hint.applyMb";
      if (!s.slide.methyleneBlue.washed) return "lab1.hint.wash";
      if (!s.slide.blotted) return "lab1.hint.blot";
      if (!s.slide.oilApplied) return "lab1.hint.applyOil";
      return "lab1.hint.toMicroscope";
    default:
      return "ui.empty";
  }
}

export function Lab1Workbench() {
  const router = useRouter();
  const tg = useTranslations();
  const mountLab = useLab2DStore((s) => s.mountLab);
  const resetLab = useLab2DStore((s) => s.resetLab);
  const advanceStage = useLab2DStore((s) => s.advanceStage);
  const cfg = useLab2DStore((s) => s.config);
  const state = useLab2DStore((s) => s.state);

  const tableRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Record<string, { x: number; y: number }>>({});
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const lastPtr = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [hoverTarget, setHoverTarget] = useState<ItemId | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const holdRef = useRef<Hold | null>(null);
  holdRef.current = hold;
  const holdIv = useRef<number | null>(null);
  // After an action completes the tool stays in the hand; this prevents the
  // same target from immediately re-triggering until the pointer leaves it.
  const lockTargetRef = useRef<ItemId | "air" | null>(null);

  const [fx, setFx] = useState<Fx | null>(null);
  const fxKey = useRef(0);
  const [binBump, setBinBump] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [mbReady, setMbReady] = useState(false);
  const mbReadyRef = useRef(false);
  mbReadyRef.current = mbReady;
  const [mbLeft, setMbLeft] = useState(0);
  // Blue methylene-blue runoff pooled in the kidney tray after the wash step,
  // showing the tray's purpose (catching the dye washed off the slide).
  const [trayStained, setTrayStained] = useState(false);

  // Collapsible tool tray (open by default).
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Loop orientation in 4 directions (CSS deg): 0 = ring left, 90 = ring up,
  // 180 = ring right, 270 = ring down. Rotated by R / the ↻ button.
  const [loopDeg, setLoopDeg] = useState(0);
  const loopDegRef = useRef(0);
  loopDegRef.current = loopDeg;
  // Two-phase loop heating accumulators (vertical + horizontal).
  const heatV = useRef(0);
  const heatH = useRef(0);

  // --- Mode / exam state ---
  // null = mode picker shown. "learn" = guided (hints, ✓). "exam" = graded.
  const [mode, setMode] = useState<LabMode | null>(null);
  const modeRef = useRef<LabMode | null>(null);
  modeRef.current = mode;
  const [examPhase, setExamPhase] = useState<ExamPhase>("planning");
  const plannedOrder = useRef<string[]>([]);
  const [actionLog, setActionLog] = useState<ExamAction[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const isExam = mode === "exam";
  const examActive = isExam && examPhase === "execution";

  const recordAction = useCallback((intent: string, loopHeat?: number) => {
    setActionLog((log) => [...log, { intent, ts: Date.now(), ...(loopHeat != null ? { loopHeat } : {}) }]);
  }, []);

  useEffect(() => {
    mountLab(config);
  }, [mountLab]);

  useEffect(() => {
    if (!cfg || modeRef.current === "exam") return; // exam has no stage progression
    const idx = cfg.stages.findIndex((st) => st.id === state.currentStageId);
    if (idx < 0 || idx >= cfg.stages.length - 1) return;
    const stg = cfg.stages[idx];
    const rec = state.stages[state.currentStageId];
    if (rec?.status === "active" && stg.check(state).ok) advanceStage();
  }, [cfg, state, advanceStage]);

  useEffect(() => {
    const fresh =
      !state.match.struck &&
      !state.lamp.lit &&
      !state.slide.onRack &&
      state.slide.fixPasses === 0 &&
      !state.slide.methyleneBlue.applied &&
      state.score.earned === 0;
    if (fresh) {
      setPlaced((p) => (Object.keys(p).length ? {} : p));
      heatV.current = 0;
      heatH.current = 0;
      setLoopDeg(0);
      setTrayStained(false);
    }
  }, [
    state.match.struck,
    state.lamp.lit,
    state.slide.onRack,
    state.slide.fixPasses,
    state.slide.methyleneBlue.applied,
    state.score.earned,
  ]);

  useEffect(() => {
    if (state.slide.methyleneBlue.applied && !state.slide.methyleneBlue.washed) {
      setMbReady(false);
      setMbLeft(10);
      const iv = window.setInterval(() => setMbLeft((c) => Math.max(0, c - 1)), 1000);
      const to = window.setTimeout(() => setMbReady(true), 10000);
      return () => {
        window.clearInterval(iv);
        window.clearTimeout(to);
      };
    }
  }, [state.slide.methyleneBlue.applied, state.slide.methyleneBlue.washed]);

  // The loop cools after flaming (glowing red → grey over ~4s). Realistic in
  // both modes; in exam, sampling while still hot is a graded mistake.
  useEffect(() => {
    if (state.loop.heatLevel <= 0) return;
    const iv = window.setInterval(() => {
      const s = useLab2DStore.getState();
      if (s.state.loop.heatLevel <= 0) {
        window.clearInterval(iv);
        return;
      }
      s.patchState((d) => {
        d.loop.heatLevel = Math.max(0, Math.round((d.loop.heatLevel - 0.08) * 100) / 100);
      });
    }, 350);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loop.heatLevel > 0]);

  const flashAt = useCallback((kind: Fx["kind"], x: number, y: number) => {
    fxKey.current += 1;
    setFx({ kind, x, y, key: fxKey.current });
    window.setTimeout(() => setFx(null), 1000);
  }, []);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  /** Screen-space active point of the dragged tool (its working end). The loop's
   *  wire ring rotates with loopDeg: 0 left, 90 up, 180 right, 270 down. */
  function hitPoint(d: DragState, clientX: number, clientY: number) {
    const def = ITEM_BY_ID[d.id];
    if (d.id === "loop") {
      const r = Math.abs(def.tipX ?? 100) * GHOST_SCALE;
      switch (loopDegRef.current) {
        case 90:
          return { hx: clientX, hy: clientY - r }; // ring up
        case 180:
          return { hx: clientX + r, hy: clientY }; // ring right
        case 270:
          return { hx: clientX, hy: clientY + r }; // ring down
        default:
          return { hx: clientX - r, hy: clientY }; // ring left
      }
    }
    return { hx: clientX + (def.tipX ?? 0) * GHOST_SCALE, hy: clientY + (def.tipY ?? 0) * GHOST_SCALE };
  }

  const targetAt = useCallback((px: number, py: number, exclude: ItemId): ItemId | null => {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    for (const [id, pos] of Object.entries(placedRef.current)) {
      const itemId = id as ItemId;
      if (itemId === exclude) continue;
      const def = ITEM_BY_ID[itemId];
      if (!def.target) continue;
      // A tight custom hit-zone (e.g. the lamp's flame) is used as-is, with no
      // extra drop-padding; everything else uses its full box + DROP_PAD.
      const tight = def.hitW != null;
      const zw = def.hitW ?? def.w;
      const zh = def.hitH ?? def.h;
      const pad = tight ? 0 : DROP_PAD;
      const cx = (pos.x / 100) * rect.width + (def.hitDX ?? 0);
      const cy = (pos.y / 100) * rect.height + (def.hitDY ?? 0);
      if (
        px >= cx - zw / 2 - pad &&
        px <= cx + zw / 2 + pad &&
        py >= cy - zh / 2 - pad &&
        py <= cy + zh / 2 + pad
      )
        return itemId;
    }
    return null;
  }, []);

  function placeOrRemove(id: ItemId, intent: StepId, clientX: number, clientY: number) {
    const rect = tableRef.current?.getBoundingClientRect();
    if (intent === "discard-match") {
      setPlaced((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
      return;
    }
    if (!rect) return;
    const x = Math.max(4, Math.min(96, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(6, Math.min(94, ((clientY - rect.top) / rect.height) * 100));
    setPlaced((p) => ({ ...p, [id]: { x, y } }));
  }

  function cancelHold() {
    if (holdIv.current) {
      window.clearInterval(holdIv.current);
      holdIv.current = null;
    }
    holdRef.current = null;
    setHold(null);
  }

  /** Perform a protocol action. Exam mode: every action is allowed (no
   *  preconditions/stage gating) and recorded for end-of-run grading. Learn
   *  mode: the engine enforces order and we report success on a real change. */
  function performIntent(intent: StepId, target: ItemId | "air"): boolean {
    const store = useLab2DStore.getState();
    if (modeRef.current === "exam") {
      const loopHeat = intent === "take-sample" ? store.state.loop.heatLevel : undefined;
      store.applyStepRaw(intent);
      // The eyepiece view is shown from the result screen, not mid-run.
      if (intent === "open-microscope") store.patchState((d) => { d.microscopeOpen = false; });
      recordAction(intent, loopHeat);
      onSuccess(intent, target);
      return true;
    }
    const before = store.state;
    store.dispatchStep(intent);
    const after = useLab2DStore.getState().state;
    if (after !== before) {
      onSuccess(intent, target);
      return true;
    }
    return false;
  }

  function completeAction(intent: StepId, target: ItemId | "air") {
    performIntent(intent, target);
    cancelHold();
    // Sterilization is finished → reset the two-phase heat accumulators.
    if (intent === "sterilize-loop" || intent === "resterilize-loop") {
      heatV.current = 0;
      heatH.current = 0;
    }
    // The tool STAYS in the hand — the student keeps holding it until they
    // release. Lock this target so it doesn't immediately re-trigger.
    lockTargetRef.current = target;
  }

  function startTimed(kind: Kind, target: ItemId | "air", intent: StepId, duration: number) {
    cancelHold();
    // NOTE: heatV/heatH are NOT reset here — the student heats the loop vertical
    // in one hold and horizontal in another (touchscreen-friendly); both
    // accumulate until sterilization completes, then they reset.
    const h: Hold = { kind, target, intent, progress: 0 };
    holdRef.current = h;
    setHold(h);
    let p = 0;
    holdIv.current = window.setInterval(() => {
      let prog: number;
      if (kind === "hold") {
        // Loop sterilisation: heat in BOTH orientations. The student rotates the
        // loop with the on-screen ↻ button (touch-only — no keyboard). Vertical
        // (ring up/down) fills heatV; horizontal (ring side) fills heatH; both
        // must reach full before the wire is sterile.
        const half = HOLD_DUR / 2;
        const vert = loopDegRef.current === 90 || loopDegRef.current === 270;
        if (vert) heatV.current = Math.min(1, heatV.current + TICK / half);
        else heatH.current = Math.min(1, heatH.current + TICK / half);
        prog = (heatV.current + heatH.current) / 2;
        if (heatV.current >= 1 && heatH.current >= 1) {
          completeAction(intent, target);
          return;
        }
      } else {
        p += TICK / duration;
        if (p >= 1) {
          completeAction(intent, target);
          return;
        }
        prog = p;
      }
      const nh: Hold = { kind, target, intent, progress: prog };
      holdRef.current = nh;
      setHold(nh);
    }, TICK);
  }

  function startRub(target: ItemId, intent: StepId) {
    cancelHold();
    const h: Hold = { kind: "rub", target, intent, progress: 0 };
    holdRef.current = h;
    setHold(h);
  }

  /** Touch action that fires once on contact and keeps the tool in the hand
   *  (light the lamp, pass the slide over the flame). Re-fires on each re-entry
   *  because the lock clears when the pointer leaves the target. */
  function fireContact(intent: StepId, target: ItemId | "air") {
    performIntent(intent, target);
    lockTargetRef.current = target;
  }

  const startDrag = useCallback((id: ItemId, e: React.PointerEvent) => {
    const fromSidebar = !placedRef.current[id];
    lastPtr.current = { x: e.clientX, y: e.clientY };
    lockTargetRef.current = null;
    setDrag({ id, fromSidebar, px: e.clientX, py: e.clientY });
  }, []);

  /** The action the pointer is currently over (target may be "air" for drying). */
  function desiredAction(d: DragState, clientX: number, clientY: number) {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const inside = clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    if (!inside) return null;
    const s = useLab2DStore.getState().state;
    const examMode = modeRef.current === "exam";
    const { hx, hy } = hitPoint(d, clientX, clientY);
    const tg = targetAt(hx - rect.left, hy - rect.top, d.id);
    if (tg) {
      // Loop/slide need a lit flame; the match itself is what lights it.
      if (tg === "lamp" && !s.lamp.lit && d.id !== "match") return null;
      const intent = intentFor(d.id, tg, s);
      // Learn mode lets air-dry win until the smear is dried; exam mode allows
      // fixing whenever (a wet fix is graded down, not blocked).
      if (intent && (examMode || !(intent === "flame-fix" && !s.slide.airDried))) {
        return { target: tg as ItemId | "air", intent, kind: actionKind(d.id, tg) };
      }
    }
    // Slide held in the open air → air-drying (gated by stage in learn mode, by
    // state alone in exam mode since there are no stages).
    if (d.id === "slide" && s.slide.smeared && !s.slide.airDried && (examMode || s.currentStageId === "stage-3")) {
      return { target: "air" as const, intent: "air-dry" as StepId, kind: "airdry" as Kind };
    }
    return null;
  }

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      const dx = e.clientX - lastPtr.current.x;
      const dy = e.clientY - lastPtr.current.y;
      lastPtr.current = { x: e.clientX, y: e.clientY };
      setDrag((d) => (d ? { ...d, px: e.clientX, py: e.clientY } : d));
      const d = dragRef.current;
      if (!d) return;

      const desired = desiredAction(d, e.clientX, e.clientY);
      const h = holdRef.current;

      // Release the "already-consumed" lock once we leave that target.
      if (lockTargetRef.current && (!desired || desired.target !== lockTargetRef.current)) {
        lockTargetRef.current = null;
      }

      if (!desired) {
        // Nothing valid under the pointer.
        if (h && h.kind !== "rub") cancelHold(); // timed needs continuous contact
        setHoverTarget(null);
        return;
      }
      setHoverTarget(desired.target === "air" ? null : desired.target);

      // This target's action was just completed and the tool is still in hand.
      if (lockTargetRef.current === desired.target) return;

      // Contact actions (light lamp / pass slide over flame) fire on touch and
      // keep the tool in hand; the lock makes each re-entry count as one pass.
      if (desired.kind === "contact") {
        if (h) cancelHold();
        fireContact(desired.intent, desired.target);
        return;
      }

      if (desired.kind === "instant") {
        if (h) cancelHold();
        return; // fires on release
      }

      // Inserting the loop into the TUBE: the ring auto-orients DOWN (270°) so the
      // student never has to rotate it by hand on a touchscreen.
      if (desired.kind === "sample" && desired.target === "culture" && loopDegRef.current !== 270) {
        setLoopDeg(270);
        loopDegRef.current = 270;
      }

      if (!h || h.target !== desired.target || h.kind !== desired.kind) {
        if (desired.kind === "rub") startRub(desired.target as ItemId, desired.intent);
        else startTimed(desired.kind, desired.target, desired.intent, desired.kind === "sample" ? SAMPLE_DUR : desired.kind === "airdry" ? AIRDRY_DUR : HOLD_DUR);
        return;
      }

      // Same action continues. Rub accumulates from movement; timed via interval.
      if (h.kind === "rub") {
        const np = h.progress + Math.hypot(dx, dy) * RUB_K;
        if (np >= 1) {
          completeAction(h.intent, h.target);
        } else {
          const nh: Hold = { ...h, progress: np };
          holdRef.current = nh;
          setHold(nh);
        }
      }
    }
    function onUp(e: PointerEvent) {
      resolveDrop(e);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag?.id]);

  function endDrag() {
    setDrag(null);
    setHoverTarget(null);
  }

  function resolveDrop(e: PointerEvent) {
    cancelHold(); // abandon any in-progress (unfinished) hold/rub
    lockTargetRef.current = null;
    const d = dragRef.current;
    const rect = tableRef.current?.getBoundingClientRect();
    if (!d || !rect) {
      endDrag();
      return;
    }
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    const store = useLab2DStore.getState();

    // Released over the tray → put the tool away (manual return to the sidebar).
    if (!inside) {
      if (!d.fromSidebar) {
        setPlaced((p) => {
          const n = { ...p };
          delete n[d.id];
          return n;
        });
      }
      endDrag();
      return;
    }

    // Instant actions fire on release; hold/rub actions already fired mid-drag,
    // so on release we simply place the tool down where it was let go.
    const { hx, hy } = hitPoint(d, e.clientX, e.clientY);
    const target = targetAt(hx - rect.left, hy - rect.top, d.id);
    if (target) {
      const intent = intentFor(d.id, target, store.state);
      if (intent && actionKind(d.id, target) === "instant") {
        if (modeRef.current === "exam") {
          // Allow every action; early/wrong ones are graded down, not blocked.
          performIntent(intent, target);
        } else if (intent === "wash-mb" && !mbReadyRef.current) {
          showToast(tg("lab1.toast.dyeWait"));
        } else if (!performIntent(intent, target)) {
          showToast(tg("lab1.toast.notNow"));
        }
        placeOrRemove(d.id, intent, e.clientX, e.clientY);
        endDrag();
        return;
      }
    }

    // Place / reposition the tool on the bench (stays until manually removed).
    let xPct = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    let yPct = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    // The loop seats upright in its stand's centre sleeve ONLY when let go near
    // the stand — otherwise it stays wherever it's dropped, so the student can
    // park it anywhere on the bench and rotate it in place (the ↻ button rides
    // along with the loop). When seated it orients vertically (ring up, handle
    // down into the sleeve); the px offset (loop centre 55px below the stand
    // centre) keeps seating bench-height independent.
    if (d.id === "loop" && placedRef.current["loop-stand"]) {
      const st = placedRef.current["loop-stand"];
      const def = ITEM_BY_ID["loop-stand"];
      const scx = (st.x / 100) * rect.width;
      const scy = (st.y / 100) * rect.height;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const nearStand =
        px >= scx - def.w / 2 - DROP_PAD &&
        px <= scx + def.w / 2 + DROP_PAD &&
        py >= scy - def.h / 2 - DROP_PAD &&
        py <= scy + def.h / 2 + DROP_PAD;
      if (nearStand) {
        xPct = st.x;
        yPct = st.y + (-55 / rect.height) * 100;
        setLoopDeg(90);
      }
    }
    // The culture tube seats in its rack (shtativ) ONLY when dropped over the
    // rack — otherwise it stays where it's dropped, so the student can take it
    // out onto the bench (e.g. to dip the loop into it). When seated it snaps
    // into the front-centre hole: both render 1:1 with their viewBox, so the
    // offset is in px (then % of bench height) to align the tube's base (tube
    // y222) with the rack's front dimple (rack y152) — tube centre 59.5px above.
    if (d.id === "culture" && placedRef.current["tube-rack"]) {
      const rk = placedRef.current["tube-rack"];
      const def = ITEM_BY_ID["tube-rack"];
      const rcx = (rk.x / 100) * rect.width;
      const rcy = (rk.y / 100) * rect.height;
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const overRack =
        px >= rcx - def.w / 2 - DROP_PAD &&
        px <= rcx + def.w / 2 + DROP_PAD &&
        py >= rcy - def.h / 2 - DROP_PAD &&
        py <= rcy + def.h / 2 + DROP_PAD;
      if (overRack) {
        xPct = rk.x;
        yPct = rk.y + (-59.5 / rect.height) * 100;
      }
    }
    // The slide may only sit on the staining bridge — snap to it.
    if (d.id === "slide") {
      const br = placedRef.current["bridge"];
      if (br) {
        xPct = br.x;
        yPct = br.y - 4;
      } else if (modeRef.current !== "exam") {
        showToast(tg("lab1.toast.needBridge"));
      }
    }
    setPlaced((p) => ({ ...p, [d.id]: { x: xPct, y: yPct } }));
    if (d.id === "slide" && !store.state.slide.onRack) {
      if (modeRef.current === "exam") store.applyStepRaw("pick-slide");
      else store.dispatchStep("pick-slide");
    }
    endDrag();
  }

  function onSuccess(intent: string, target: ItemId | "air") {
    const sp = placedRef.current["slide"];
    const sx = sp?.x ?? 50;
    const sy = sp?.y ?? 50;
    if (intent === "discard-match") setBinBump((k) => k + 1);
    if (intent === "add-nacl") flashAt("drop-nacl", sx, sy);
    else if (intent === "apply-mb") flashAt("drop-mb", sx, sy);
    else if (intent === "apply-oil") flashAt("drop-oil", sx, sy);
    else if (intent === "wash-mb") {
      flashAt("wash", sx, sy);
      // The rinsed-off methylene blue collects in the tray under the bridge.
      if (placedRef.current["tray"]) setTrayStained(true);
    }
    else if (intent === "blot-filter") flashAt("blot", sx, sy);
    else if (target !== "air" && modeRef.current !== "exam") {
      // The green ✓ is guidance — only in learn mode.
      const tp = placedRef.current[target];
      flashAt("check", tp?.x ?? sx, tp?.y ?? sy);
    }
  }

  /** Re-cap the lamp to put it out (a click, when lit). */
  function extinguishLamp() {
    const store = useLab2DStore.getState();
    if (!store.state.lamp.lit) return;
    store.patchState((d) => {
      d.lamp.lit = false;
      d.lamp.uncapped = false;
    });
    if (modeRef.current === "exam") recordAction("extinguish-lamp");
  }

  function startExam(order: string[]) {
    plannedOrder.current = order;
    setExamPhase("execution");
  }

  function finishExam() {
    const store = useLab2DStore.getState();
    const p = placedRef.current;
    const sameSpot = (a?: { x: number; y: number }, b?: { x: number; y: number }) =>
      !!a && !!b && Math.abs(a.x - b.x) < 2;
    const loopOnStand = sameSpot(p["loop"], p["loop-stand"]);
    const tubeInRack = sameSpot(p["culture"], p["tube-rack"]);
    setExamResult(scoreExam(plannedOrder.current, actionLog, store.state, { loopOnStand, tubeInRack }));
    setExamPhase("result");
  }

  function restart() {
    resetLab();
    setPlaced({});
    setActionLog([]);
    setExamResult(null);
    plannedOrder.current = [];
    setLoopDeg(0);
    heatV.current = 0;
    heatH.current = 0;
    setExamPhase("planning");
    setMode(null);
  }

  if (!cfg) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Yuklanmoqda…</div>;
  }

  const placedSet = new Set(Object.keys(placed)) as Set<ItemId>;
  const draggingDef = drag ? ITEM_BY_ID[drag.id] : null;
  const hint = nextHint(state);
  const slidePos = placed["slide"];
  const lampPos = placed["lamp"];

  const validTargets = new Set<ItemId>();
  if (drag) {
    ITEMS.forEach((it) => {
      if (it.target && placedSet.has(it.id) && it.id !== drag.id && intentFor(drag.id, it.id, state)) validTargets.add(it.id);
    });
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden select-none text-slate-800" style={{ background: "#ececec" }}>
      <header className="z-30 flex items-center gap-3 border-b border-slate-300/70 bg-white/85 px-3 py-2 backdrop-blur">
        <button onClick={() => router.push("/")} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">
          ←
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide text-slate-800">{tg("labs.1.title")}</span>
          <span className="text-[11px] text-slate-500">{tg("labs.1.subtitle")} · Lab 1</span>
        </div>
        {!isExam && (
          <div className="mx-auto flex max-w-[46%] items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow">
            <span className="text-amber-300">➜</span>
            <span className="truncate">{tg(hint, { n: state.slide.fixPasses })}</span>
          </div>
        )}
        {examActive && (
          <div className="mx-auto flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
            <span>📝</span>
            <span>{tg("ui.examBanner")}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {examActive && (
            <button onClick={finishExam} className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-400">
              {tg("lab1.finish")}
            </button>
          )}
          <LanguageSwitcher />
          <button onClick={restart} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">
            ↻ {tg("common.restart")}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && !(isExam && examPhase === "planning") && (
          <ToolSidebar state={state} placed={placedSet} draggingId={drag?.id ?? null} binBump={binBump} onStartDrag={startDrag} showHints={!isExam} />
        )}

        <div ref={tableRef} className="relative flex-1 overflow-hidden" style={{ background: "linear-gradient(180deg,#ededed 0%,#e6e6e6 55%,#8f8f8f 55%,#9a9a9a 100%)" }}>
          {/* During planning the bench is idle — focus is on the right panel. */}
          {isExam && examPhase === "planning" && (
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-slate-500/10">
              <p className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-medium text-slate-500 shadow">{tg("ui.planFirst")}</p>
            </div>
          )}
          {/* Collapsible-tray toggle (‹ close / › open) */}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="absolute left-2 top-1/2 z-40 grid h-14 w-7 -translate-y-1/2 place-items-center rounded-lg bg-white/90 text-xl font-bold text-slate-600 shadow-md transition hover:bg-white"
            title={sidebarOpen ? tg("lab1.sidebarClose") : tg("lab1.sidebarOpen")}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>

          {placedSet.size === 0 && !drag && !isExam && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-2xl bg-white/70 px-5 py-3 text-sm font-medium text-slate-500 shadow">{tg("ui.dragToTable")}</p>
            </div>
          )}

          {ITEMS.filter((it) => placedSet.has(it.id)).map((it) => {
            const pos = placed[it.id];
            const isValid = validTargets.has(it.id);
            const isHover = hoverTarget === it.id;
            // Open ONLY the vessel the loop is actually sampling from (its hold
            // target) — not both the tube and the dish at once.
            const sampling = hold?.kind === "sample" && hold.target === it.id;
            const plugOff = it.id === "culture" && sampling;
            const petriLidOff = it.id === "petri" && sampling;
            return (
              <div key={it.id} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)", opacity: drag?.id === it.id ? 0.35 : 1 }}>
                {(isValid || isHover) && (
                  <div
                    className="pointer-events-none absolute rounded-xl"
                    style={{
                      // Items with a tight hit-zone (the lamp's flame) show the
                      // box AT that zone — so the visible rectangle == the active
                      // area; everything else boxes the whole item (-inset-3).
                      ...(it.hitW != null
                        ? {
                            left: it.w / 2 + (it.hitDX ?? 0) - it.hitW / 2,
                            top: it.h / 2 + (it.hitDY ?? 0) - (it.hitH ?? it.h) / 2,
                            width: it.hitW,
                            height: it.hitH ?? it.h,
                          }
                        : { inset: -12 }),
                      border: `2px dashed ${isHover ? "#7c3aed" : "#a78bfa"}`,
                      boxShadow: isHover ? "0 0 18px rgba(124,58,237,0.45)" : "none",
                      animation: "wbZonePulse 1.4s ease-in-out infinite",
                    }}
                  />
                )}
                <div
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startDrag(it.id, e);
                  }}
                  onDoubleClick={() =>
                    setPlaced((p) => {
                      const n = { ...p };
                      delete n[it.id];
                      return n;
                    })
                  }
                  style={{ cursor: "grab" }}
                  title={tg(it.label)}
                >
                  {it.id === "loop" ? (
                    <div style={{ transform: `rotate(${loopDeg}deg)`, transition: "transform 0.12s ease" }}>
                      {it.render(state, { binBump })}
                    </div>
                  ) : (
                    it.render(state, { binBump, tubePlugOff: plugOff, petriLidOff: petriLidOff, trayStained })
                  )}
                </div>
                {/* Touch rotate control: sits beside the loop (lower-right, clear of
                    the wire in both orientations). Tap to turn it 90° so the
                    student can flame it vertical AND horizontal — no keyboard. */}
                {it.id === "loop" && !state.loop.resterilized && (isExam || state.currentStageId === "stage-2") && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setLoopDeg((dg) => (dg + 90) % 360);
                    }}
                    title={tg("lab1.loopRotate")}
                    className="absolute z-30 grid h-12 w-12 place-items-center rounded-full bg-violet-600 text-xl text-white shadow-lg ring-2 ring-white/70 transition hover:bg-violet-500 active:scale-90"
                    style={{ left: "calc(50% + 80px)", top: "calc(50% + 54px)", transform: "translate(-50%,-50%)" }}
                  >
                    <span className="inline-block" style={{ transform: `rotate(${loopDeg}deg)`, transition: "transform 0.15s ease" }}>↻</span>
                  </button>
                )}
                {/* Re-cap the lamp to put it out (click the cap). */}
                {it.id === "lamp" && state.lamp.lit && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      extinguishLamp();
                    }}
                    title={tg("lab1.extinguish")}
                    className="absolute right-0 top-0 z-30 grid h-7 w-7 place-items-center rounded-full bg-slate-700/90 text-[13px] text-white shadow ring-1 ring-white/40 transition hover:bg-slate-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          {/* Front face of the tube rack — painted ON TOP of the seated tube so
              the tube passes THROUGH the hole (body sticks out above, the hole
              opening + front lips occlude it, lower body shows in the open front). */}
          {placedSet.has("tube-rack") && placedSet.has("culture") && placed["tube-rack"] && (
            <div
              className="pointer-events-none absolute"
              style={{ left: `${placed["tube-rack"].x}%`, top: `${placed["tube-rack"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}
            >
              <TestTubeRack width={340} front />
            </div>
          )}

          {/* Front face of the loop stand — frosts the seated loop's handle so it
              reads as standing INSIDE the plastic sleeve, not in front of it. */}
          {placedSet.has("loop-stand") && placedSet.has("loop") && placed["loop-stand"] && (
            <div
              className="pointer-events-none absolute"
              style={{ left: `${placed["loop-stand"].x}%`, top: `${placed["loop-stand"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}
            >
              <LoopStand width={200} front />
            </div>
          )}

          {/* Smear marks being written onto the slide as the loop rubs */}
          {hold?.intent === "smear-sample" && slidePos && (
            <div className="pointer-events-none absolute z-20" style={{ left: `${slidePos.x}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="120" height="46" viewBox="0 0 120 46">
                <path
                  d="M60 23 m -17 0 a 17 8.5 0 1 0 34 0 a 13 6.5 0 1 0 -26 0 a 9 4.5 0 1 0 18 0"
                  stroke="#cdbb93"
                  strokeWidth="2.6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={170}
                  strokeDashoffset={170 * (1 - hold.progress)}
                  opacity="0.9"
                />
              </svg>
            </div>
          )}

          {/* Cleaning shine sweeping across the slide as the alcohol pad wipes */}
          {hold?.intent === "clean-slide" && slidePos && (
            <div
              className="pointer-events-none absolute z-20 overflow-hidden rounded"
              style={{ left: `${slidePos.x}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)", width: 104, height: 36 }}
            >
              <div
                className="absolute top-0 h-full"
                style={{
                  width: 26,
                  left: `${-25 + hold.progress * 110}%`,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
                  transform: "skewX(-16deg)",
                }}
              />
            </div>
          )}

          {/* Fixation pass counter near the lamp (stage 3) */}
          {lampPos && state.currentStageId === "stage-3" && state.slide.airDried && state.slide.fixPasses < 3 && (
            <div
              className="pointer-events-none absolute z-20 flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 shadow-md"
              style={{ left: `${lampPos.x}%`, top: `${lampPos.y - 16}%`, transform: "translate(-50%,-50%)" }}
            >
              <span className="grid h-6 w-6 place-items-center rounded-md bg-amber-300 text-sm font-bold text-slate-900">{state.slide.fixPasses}</span>
              <span className="text-sm font-bold text-slate-700">/3</span>
            </div>
          )}

          {/* MB contact countdown — learn mode only (guidance). Pinned top-centre,
              matching the wait indicators in the other labs. */}
          {!isExam && slidePos && state.slide.methyleneBlue.applied && !state.slide.methyleneBlue.washed && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-40 -translate-x-1/2">
              <HourglassWait
                progress={mbReady ? 1 : (10 - mbLeft) / 10}
                time={mbReady ? tg("lab1.mb.ready") : tg("lab1.mb.waiting", { s: mbLeft })}
                done={mbReady}
              />
            </div>
          )}
          {/* Exam mode: no text — the dye just slowly deepens on the smear as it
              develops (subtle cue; washing too early is graded down). */}
          {isExam && slidePos && state.slide.methyleneBlue.applied && !state.slide.methyleneBlue.washed && (
            <motion.div
              key="mb-develop"
              className="pointer-events-none absolute z-[19] rounded-sm"
              style={{ left: `${slidePos.x}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)", width: 92, height: 27, background: "#16308f", mixBlendMode: "multiply" }}
              initial={{ opacity: 0.12 }}
              animate={{ opacity: 0.6 }}
              transition={{ duration: 9, ease: "easeIn" }}
            />
          )}

          {fx && (fx.kind === "drop-nacl" || fx.kind === "drop-mb" || fx.kind === "drop-oil") && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 8}%` }}>
              {fx.kind === "drop-nacl" && <Drop trigger={fx.key} color="#88c5d8" />}
              {fx.kind === "drop-mb" && <Drop trigger={fx.key} color="#2746c8" fallHeight={64} />}
              {fx.kind === "drop-oil" && <Drop trigger={fx.key} color="#e7b94e" fallHeight={64} />}
            </div>
          )}
          {/* Water-wash animation: a stream sweeps down the slide and the rinsed
              blue dye drains downward toward the tray (where it pools). The box
              extends below the slide so the runoff visibly heads into the basin. */}
          {fx?.kind === "wash" && (
            <div
              key={fx.key}
              className="pointer-events-none absolute z-30 overflow-hidden"
              style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: "translate(-50%,-30%)", width: 130, height: 200 }}
            >
              {/* Clear water stream rinsing the slide */}
              <motion.div
                initial={{ y: -90, opacity: 0.9 }}
                animate={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.95, ease: "easeIn" }}
                style={{ width: "100%", height: 60, background: "linear-gradient(180deg, rgba(150,200,225,0) 0%, rgba(150,200,225,0.9) 50%, rgba(150,200,225,0) 100%)" }}
              />
              {/* Blue dye carried off the slide, draining down into the tray */}
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ y: 4, opacity: 0 }}
                  animate={{ y: 168, opacity: [0, 0.85, 0.85, 0] }}
                  transition={{ duration: 0.85, delay: i * 0.07, ease: "easeIn" }}
                  className="absolute rounded-full"
                  style={{ left: `${20 + i * 16}%`, width: 6, height: 14, background: "#2c46b0" }}
                />
              ))}
            </div>
          )}
          {/* Filter-paper blot: a soft press + absorbing patch (no rubbing —
              the paper is simply laid on the slide and wicks the water away). */}
          {fx?.kind === "blot" && (
            <div
              key={fx.key}
              className="pointer-events-none absolute z-30"
              style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: "translate(-50%,-50%)", width: 104, height: 36 }}
            >
              <motion.div
                initial={{ scale: 1.08, opacity: 0 }}
                animate={{ scale: [1.08, 0.97, 1], opacity: [0, 0.6, 0] }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute inset-0 rounded"
                style={{ background: "rgba(255,255,255,0.55)", filter: "blur(2px)" }}
              />
            </div>
          )}
          {fx?.kind === "check" && (
            <div key={fx.key} className="pointer-events-none absolute z-30 grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-white shadow-lg" style={{ left: `${fx.x}%`, top: `${fx.y}%`, animation: "wbCheckPop 0.5s ease-out" }}>
              ✓
            </div>
          )}

          {/* Drag ghost */}
          {drag && draggingDef && (
            <div className="pointer-events-none fixed z-50" style={{ left: drag.px, top: drag.py, transform: "translate(-50%,-50%) scale(1.06)", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
              {drag.id === "loop" ? (
                // The loop shows the student's chosen orientation (↻ button):
                // horizontal or vertical (ring down). It glows while heating and
                // dips down to touch a colony in the open Petri dish.
                <div
                  style={{
                    transform: `rotate(${loopDeg}deg) translateY(${hold?.kind === "sample" && hold.target === "petri" ? hold.progress * 14 : 0}px)`,
                    transition: "transform 0.12s ease",
                  }}
                >
                  <BacterialLoop heatLevel={hold?.kind === "hold" ? hold.progress : state.loop.heatLevel} />
                </div>
              ) : (
                draggingDef.render(state, { binBump })
              )}

              {/* Warm glow while fixing a slide over the flame */}
              {hold && drag.id === "slide" && hold.kind === "hold" && (
                <div className="absolute inset-0 rounded-md" style={{ background: `rgba(255,140,40,${0.15 + hold.progress * 0.4})`, mixBlendMode: "screen" }} />
              )}

              {/* Match head heating up (ember grows) while striking */}
              {hold?.intent === "strike-match" && (
                <div
                  className="absolute"
                  style={{
                    left: 16,
                    top: 17,
                    width: 24,
                    height: 24,
                    transform: "translate(-50%,-50%)",
                    borderRadius: "50%",
                    background: `radial-gradient(circle, rgba(255,190,50,${0.3 + hold.progress * 0.6}) 0%, rgba(255,110,20,${hold.progress * 0.55}) 45%, transparent 70%)`,
                    filter: "blur(1px)",
                  }}
                />
              )}

              {/* Airflow lines while air-drying in the hand */}
              {hold && hold.kind === "airdry" && (
                <div className="absolute -inset-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="absolute h-[2px] w-10 rounded bg-sky-300/80" style={{ top: `${20 + i * 26}%`, left: 0, animation: `wbAirflow 1.1s linear ${i * 0.25}s infinite` }} />
                  ))}
                </div>
              )}

              {/* No circular indicators — actions show their state on the
                  object. Air-dry keeps only a small countdown text label. */}
              {hold && hold.kind === "airdry" && (
                <div className="absolute left-1/2 top-[120%] -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {tg("lab1.airDryLabel", { s: Math.ceil((1 - hold.progress) * (AIRDRY_DUR / 1000)) })}
                </div>
              )}

              {/* While sterilising in the flame: show which orientation is heating
                  and a language-neutral V/G gauge, so the student knows to release
                  and tap ↻ to flame the other side. (V = vertical, G = gorizontal) */}
              {drag.id === "loop" && hold?.kind === "hold" && hold.target === "lamp" && (
                <div className="absolute left-1/2 top-[150%] -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/85 px-2 py-0.5 text-[11px] font-semibold text-white">
                  🔥 V {heatV.current >= 1 ? "✓" : "…"} · G {heatH.current >= 1 ? "✓" : "…"}
                </div>
              )}
            </div>
          )}

          {/* No rotate control — the loop spins itself in the flame and auto-orients
              when dipped into the tube. Nothing to press on a touchscreen. */}

          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-rose-600/95 px-4 py-2 text-sm font-medium text-white shadow-lg">
                {toast}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isExam && examPhase === "planning" && <PlanningSidebar onStart={startExam} />}
      </div>

      <Lab1ResultModal examMode={isExam} />

      <AnimatePresence>{mode === null && <ModeSelect onPick={setMode} />}</AnimatePresence>

      <AnimatePresence>
        {isExam && examPhase === "result" && examResult && !state.microscopeOpen && (
          <ExamResultModal
            result={examResult}
            onRestart={restart}
            onViewScope={() => useLab2DStore.getState().setMicroscopeOpen(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
