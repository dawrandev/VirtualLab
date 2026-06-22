"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Drop } from "@/labs/lab1/components2d/animations/Drop";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { AlcoholJar } from "../components2d/items/AlcoholJar";
import { LAB3_ITEMS, LAB3_ITEM_BY_ID, intentFor, canIncubate, type Lab3ItemId } from "./items";
import { freshDrigalskiState, applyDrigalskiStep, type DrigalskiState, type DrigalskiIntent } from "../state";
import { INCUBATE_MS, DISPLAY_INCUBATE_HOURS, type LabMode, type ExamPhase } from "../exam/protocol";
import { scoreDrigalskiExam, type ExamAction, type ExamResult } from "../exam/scoring";
import { Lab3Sidebar } from "./Lab3Sidebar";
import { ModeSelect } from "./ModeSelect";
import { PlanningSidebar } from "./PlanningSidebar";
import { Lab3ResultModal } from "../components2d/Lab3ResultModal";
import { Lab3LearnResult } from "../components2d/Lab3LearnResult";
import { HourglassWait } from "@/components/HourglassWait";

const DROP_PAD = 26;
const GHOST_SCALE = 1.06;
const SPATULA_COOL_MS = 3200;
const TICK = 70;
const RUB_K = 0.0016;
/** The thermostat is a permanent bench fixture (top-right), never in the sidebar. */
const FIXED_INCUBATOR = { x: 85, y: 24 };

interface DragState {
  id: Lab3ItemId;
  fromSidebar: boolean;
  px: number;
  py: number;
}
type Kind = "rub" | "sample" | "contact" | "instant";
interface Hold {
  kind: Kind;
  intent: DrigalskiIntent;
  target: Lab3ItemId;
  progress: number;
}

/** How a (tool → target) action is performed. Mirrors Lab 1: striking the match
 *  is a RUB on the box, lighting the lamp is a contact touch (match stays in
 *  hand), and binning the spent match fires on release. */
function actionKind(intent: DrigalskiIntent): Kind {
  if (intent === "load-pipette") return "sample"; // timed, with a visual
  if (intent === "spread-1" || intent === "spread-2" || intent === "spread-3" || intent === "strike-match") return "rub";
  if (intent === "discard-match" || intent === "disinfect-pipette") return "instant"; // dropped into a vessel
  return "contact"; // light lamp, dip, flame, drop material, disinfect spreader
}

const SAMPLE_DUR = 1500;
interface Fx {
  kind: "drip-mat" | "dip" | "dip-chlorine" | "spark";
  x: number;
  y: number;
  key: number;
}

function nextHint(s: DrigalskiState): string {
  if (!s.dishes) return "lab3.hint.dishes";
  if (!s.lamp.lit) return s.match.struck ? "lab3.hint.lightLamp" : "lab3.hint.strikeMatch";
  if (!s.match.discarded) return "lab3.hint.discardMatch";
  // Drip the suspension first, dispose the used pipette, THEN dip + flame the spreader.
  if (!s.d1.material) return s.pipetteLoaded ? "lab3.hint.dropMaterial" : "lab3.hint.loadPipette";
  if (!s.pipetteDisinfected) return "lab3.hint.disinfectPipette";
  if (!s.spatulaSterile) return s.spatulaDipped ? "lab3.hint.flameSpatula" : "lab3.hint.dipSpatula";
  if (!s.d1.spread) return "lab3.hint.spread1";
  if (!s.d2.spread) return "lab3.hint.spread2";
  if (!s.d3.spread) return "lab3.hint.spread3";
  if (!s.spatulaDisinfected) return "lab3.hint.disinfect";
  if (!s.incubated) return "lab3.hint.incubate";
  return "lab3.hint.done";
}

export function Lab3Workbench() {
  const router = useRouter();
  const tg = useTranslations();
  const [drig, setDrig] = useState<DrigalskiState>(() => freshDrigalskiState());
  const drigRef = useRef(drig);
  drigRef.current = drig;

  const tableRef = useRef<HTMLDivElement | null>(null);
  // The thermostat is always present at its fixed station.
  const [placed, setPlaced] = useState<Record<string, { x: number; y: number }>>(() => ({ incubator: FIXED_INCUBATOR }));
  const placedRef = useRef(placed);
  placedRef.current = placed;
  // Dishes hidden inside the incubator + their bench positions to restore.
  const [inIncubator, setInIncubator] = useState<Set<string>>(new Set());
  const inIncRef = useRef(inIncubator);
  inIncRef.current = inIncubator;
  const dishHome = useRef<Record<string, { x: number; y: number }>>({});

  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const lastPtr = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [hoverTarget, setHoverTarget] = useState<Lab3ItemId | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const holdRef = useRef<Hold | null>(null);
  holdRef.current = hold;
  const holdIv = useRef<number | null>(null);
  const lockTargetRef = useRef<Lab3ItemId | null>(null);

  const [fx, setFx] = useState<Fx | null>(null);
  const fxKey = useRef(0);
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [spatulaHot, setSpatulaHot] = useState(false);
  const [binBump, setBinBump] = useState(0);
  // Learn-mode completion panel (shown once the incubated plates come out).
  const [learnResultOpen, setLearnResultOpen] = useState(false);

  // Incubation countdown.
  const [inc, setInc] = useState<{ start: number } | null>(null);
  const [incProg, setIncProg] = useState(0);

  const [mode, setMode] = useState<LabMode | null>(null);
  const modeRef = useRef<LabMode | null>(null);
  modeRef.current = mode;
  const [examPhase, setExamPhase] = useState<ExamPhase>("planning");
  const [actionLog, setActionLog] = useState<ExamAction[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  const isExam = mode === "exam";
  const examActive = isExam && examPhase === "execution";

  const flashAt = useCallback((kind: Fx["kind"], x: number, y: number, ms = 1100) => {
    fxKey.current += 1;
    const k = fxKey.current;
    setFx({ kind, x, y, key: k });
    window.setTimeout(() => setFx((f) => (f && f.key === k ? null : f)), ms);
  }, []);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1900);
  }, []);
  const recordAction = useCallback((intent: string) => {
    setActionLog((log) => [...log, { intent, ts: Date.now() }]);
  }, []);

  useEffect(() => {
    if (!spatulaHot) return;
    const t = window.setTimeout(() => setSpatulaHot(false), SPATULA_COOL_MS);
    return () => window.clearTimeout(t);
  }, [spatulaHot]);

  // Incubation countdown → growth appears, dishes come back out.
  useEffect(() => {
    if (!inc) return;
    const iv = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - inc.start) / INCUBATE_MS);
      setIncProg(p);
      if (p >= 1) {
        window.clearInterval(iv);
        setDrig((g) => applyDrigalskiStep(g, "incubate"));
        recordAction("incubate");
        // Take the plates back out onto the bench (now showing growth).
        setPlaced((pl) => ({ ...pl, ...dishHome.current }));
        setInIncubator(new Set());
        setInc(null);
        // The work ends here: show the learn-mode result panel.
        if (modeRef.current !== "exam") setLearnResultOpen(true);
      }
    }, 90);
    return () => window.clearInterval(iv);
  }, [inc, recordAction]);

  function perform(intent: DrigalskiIntent) {
    setDrig((g) => applyDrigalskiStep(g, intent));
    recordAction(intent);
    const at = (id: string) => {
      const p = placedRef.current[id];
      return { x: p?.x ?? 50, y: p?.y ?? 50 };
    };
    if (intent === "strike-match") flashAt("spark", at("matchbox").x, at("matchbox").y, 700);
    else if (intent === "discard-match") {
      setBinBump((b) => b + 1);
      setPlaced((p) => { const n = { ...p }; delete n["match"]; return n; }); // match drops into the bin
    } else if (intent === "dip-spatula") flashAt("dip", at("alcohol-jar").x, at("alcohol-jar").y, 900);
    else if (intent === "disinfect-spatula") flashAt("dip-chlorine", at("chlorine-jar").x, at("chlorine-jar").y, 900);
    else if (intent === "disinfect-pipette") {
      flashAt("dip-chlorine", at("chlorine-jar").x, at("chlorine-jar").y, 900);
      setPlaced((p) => { const n = { ...p }; delete n["pipette"]; return n; }); // used pipette goes into the jar
    }
    else if (intent === "sterilize-spatula") setSpatulaHot(true);
    else if (intent === "drop-material") flashAt("drip-mat", at("dish-1").x, at("dish-1").y);
  }

  function startIncubation() {
    setIncProg(0);
    setInc({ start: Date.now() });
  }

  function hitPoint(d: DragState, clientX: number, clientY: number) {
    const def = LAB3_ITEM_BY_ID[d.id];
    return { hx: clientX + (def.tipX ?? 0) * GHOST_SCALE, hy: clientY + (def.tipY ?? 0) * GHOST_SCALE };
  }

  const targetAt = useCallback((px: number, py: number, exclude: Lab3ItemId): Lab3ItemId | null => {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    for (const [id, pos] of Object.entries(placedRef.current)) {
      const itemId = id as Lab3ItemId;
      if (itemId === exclude) continue;
      if (inIncRef.current.has(itemId)) continue;
      const def = LAB3_ITEM_BY_ID[itemId];
      if (!def.target) continue;
      const tight = def.hitW != null;
      const zw = def.hitW ?? def.w;
      const zh = def.hitH ?? def.h;
      const pad = tight ? 0 : DROP_PAD;
      const cx = (pos.x / 100) * rect.width + (def.hitDX ?? 0);
      const cy = (pos.y / 100) * rect.height + (def.hitDY ?? 0);
      if (px >= cx - zw / 2 - pad && px <= cx + zw / 2 + pad && py >= cy - zh / 2 - pad && py <= cy + zh / 2 + pad) return itemId;
    }
    return null;
  }, []);

  const startDrag = useCallback((id: Lab3ItemId, e: React.PointerEvent) => {
    if (LAB3_ITEM_BY_ID[id].fixed) return; // permanent fixtures can't be dragged
    const fromSidebar = !placedRef.current[id];
    lastPtr.current = { x: e.clientX, y: e.clientY };
    setDrag({ id, fromSidebar, px: e.clientX, py: e.clientY });
  }, []);

  function cancelHold() {
    if (holdIv.current) {
      window.clearInterval(holdIv.current);
      holdIv.current = null;
    }
    holdRef.current = null;
    setHold(null);
  }

  function completeAction(intent: DrigalskiIntent, target: Lab3ItemId) {
    perform(intent);
    cancelHold();
    lockTargetRef.current = target;
  }

  function startTimed(target: Lab3ItemId, intent: DrigalskiIntent, duration: number) {
    cancelHold();
    const h: Hold = { kind: "sample", target, intent, progress: 0 };
    holdRef.current = h;
    setHold(h);
    let p = 0;
    holdIv.current = window.setInterval(() => {
      p += TICK / duration;
      if (p >= 1) {
        completeAction(intent, target);
        return;
      }
      const nh: Hold = { ...h, progress: p };
      holdRef.current = nh;
      setHold(nh);
    }, TICK);
  }

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      const dx = e.clientX - lastPtr.current.x;
      const dy = e.clientY - lastPtr.current.y;
      lastPtr.current = { x: e.clientX, y: e.clientY };
      setDrag((d) => (d ? { ...d, px: e.clientX, py: e.clientY } : d));
      const d = dragRef.current;
      const rect = tableRef.current?.getBoundingClientRect();
      if (!d || !rect) return;
      const { hx, hy } = hitPoint(d, e.clientX, e.clientY);
      const tgId = targetAt(hx - rect.left, hy - rect.top, d.id);
      const intent = tgId ? intentFor(d.id, tgId, drigRef.current) : null;
      const validIncubate = tgId === "incubator" && d.id.startsWith("dish-") && canIncubate(drigRef.current);
      setHoverTarget(intent || validIncubate ? tgId : null);

      const h = holdRef.current;
      if (lockTargetRef.current && tgId !== lockTargetRef.current) lockTargetRef.current = null;

      if (!intent || !tgId) {
        if (h && h.kind !== "rub") cancelHold();
        return;
      }
      // Spreading plate 1 needs a sterile spreader.
      if (intent === "spread-1" && !drigRef.current.spatulaSterile) {
        if (h) cancelHold();
        return;
      }
      if (lockTargetRef.current === tgId) return;

      const kind = actionKind(intent);
      if (kind === "contact") {
        if (h) cancelHold();
        perform(intent);
        lockTargetRef.current = tgId;
        return;
      }
      if (kind === "instant") {
        if (h) cancelHold();
        return;
      }
      if (kind === "sample") {
        if (!h || h.target !== tgId || h.kind !== "sample") startTimed(tgId, intent, SAMPLE_DUR);
        return;
      }
      // rub — accumulate from movement
      if (!h || h.target !== tgId || h.kind !== "rub") {
        const nh: Hold = { kind: "rub", target: tgId, intent, progress: 0 };
        holdRef.current = nh;
        setHold(nh);
      } else {
        const np = h.progress + Math.hypot(dx, dy) * RUB_K;
        if (np >= 1) completeAction(intent, tgId);
        else {
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

  /** Snap a placed hand tool / apparatus to its home station, returning the % pos. */
  function snapPos(id: Lab3ItemId, rect: DOMRect, fallback: { x: number; y: number }): { x: number; y: number } {
    const p = placedRef.current;
    if (id === "suspension" && p["rack"]) return { x: p["rack"].x, y: p["rack"].y + (-59.5 / rect.height) * 100 };
    // The used spreader rests in whichever jar matches its state.
    if (id === "spatula") {
      if (drigRef.current.spatulaDisinfected && p["chlorine-jar"]) return { x: p["chlorine-jar"].x, y: p["chlorine-jar"].y + (-47 / rect.height) * 100 };
      if (!drigRef.current.spatulaSterile && p["alcohol-jar"]) return { x: p["alcohol-jar"].x, y: p["alcohol-jar"].y + (-47 / rect.height) * 100 };
    }
    return fallback;
  }

  function resolveDrop(e: PointerEvent) {
    cancelHold();
    lockTargetRef.current = null;
    const d = dragRef.current;
    const rect = tableRef.current?.getBoundingClientRect();
    if (!d || !rect) {
      endDrag();
      return;
    }
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    if (!inside) {
      if (!d.fromSidebar && !d.id.startsWith("dish-")) {
        setPlaced((p) => {
          const n = { ...p };
          delete n[d.id];
          return n;
        });
      }
      endDrag();
      return;
    }

    const { hx, hy } = hitPoint(d, e.clientX, e.clientY);
    const target = targetAt(hx - rect.left, hy - rect.top, d.id);

    // Put a spread plate into the incubator → hide it; all three in → incubate.
    if (target === "incubator" && d.id.startsWith("dish-")) {
      if (!canIncubate(drigRef.current)) {
        showToast(tg("lab3.toast.needAll3"));
        endDrag();
        return;
      }
      const pos = placedRef.current[d.id];
      if (pos) dishHome.current[d.id] = pos;
      setInIncubator((s) => {
        const n = new Set(s);
        n.add(d.id);
        if (n.has("dish-1") && n.has("dish-2") && n.has("dish-3")) startIncubation();
        return n;
      });
      endDrag();
      return;
    }

    if (target) {
      const intent = intentFor(d.id, target, drigRef.current);
      if (intent) {
        if (actionKind(intent) === "instant") perform(intent);
        // Items dropped INTO a vessel are removed by perform — don't re-lay them.
        if (intent === "discard-match" || intent === "disinfect-pipette") {
          endDrag();
          return;
        }
        const fxp = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
        const fyp = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
        const pos = snapPos(d.id, rect, { x: fxp, y: fyp });
        setPlaced((p) => ({ ...p, [d.id]: pos }));
        endDrag();
        return;
      }
    }

    // Plain placement (snap apparatus/tools to their stations).
    const fxp = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const fyp = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    const pos = snapPos(d.id, rect, { x: fxp, y: fyp });
    setPlaced((p) => {
      const n = { ...p, [d.id]: pos };
      if (d.id.startsWith("dish-") && n["dish-1"] && n["dish-2"] && n["dish-3"] && !drigRef.current.dishes) {
        setDrig((g) => applyDrigalskiStep(g, "get-dishes"));
        recordAction("get-dishes");
      }
      return n;
    });
    endDrag();
  }

  function startExam() {
    setExamPhase("execution");
  }
  function finishExam() {
    setExamResult(scoreDrigalskiExam(actionLog, drigRef.current));
    setExamPhase("result");
  }
  function restart() {
    setDrig(freshDrigalskiState());
    setPlaced({ incubator: FIXED_INCUBATOR });
    setInIncubator(new Set());
    dishHome.current = {};
    setActionLog([]);
    setExamResult(null);
    setSpatulaHot(false);
    setInc(null);
    setIncProg(0);
    setLearnResultOpen(false);
    cancelHold();
    lockTargetRef.current = null;
    setExamPhase("planning");
    setMode(null);
  }

  const placedSet = new Set(Object.keys(placed).filter((k) => !inIncubator.has(k))) as Set<Lab3ItemId>;
  const movableCount = [...placedSet].filter((id) => !LAB3_ITEM_BY_ID[id].fixed).length;
  // Dishes inside the incubator are still "in use" — keep them out of the tray.
  // Fixed fixtures are never offered in the sidebar.
  const sidebarPlaced = new Set([...placedSet, ...inIncubator, ...LAB3_ITEMS.filter((i) => i.fixed).map((i) => i.id)]) as Set<Lab3ItemId>;
  const draggingDef = drag ? LAB3_ITEM_BY_ID[drag.id] : null;
  const hint = nextHint(drig);
  const renderOpts = {
    spatulaHot,
    incubatorRunning: inc != null,
    suspensionPlugOff: hold?.kind === "sample" && hold?.intent === "load-pipette",
    binBump,
  };
  const tubeInRack = !!placed["suspension"] && !!placed["rack"] && Math.abs(placed["suspension"].x - placed["rack"].x) < 2;
  const spatulaInAlcohol = !!placed["spatula"] && !!placed["alcohol-jar"] && !drig.spatulaDisinfected && Math.abs(placed["spatula"].x - placed["alcohol-jar"].x) < 3;
  const spatulaInChlorine = !!placed["spatula"] && !!placed["chlorine-jar"] && drig.spatulaDisinfected && Math.abs(placed["spatula"].x - placed["chlorine-jar"].x) < 3;

  const validTargets = new Set<Lab3ItemId>();
  if (drag) {
    LAB3_ITEMS.forEach((it) => {
      if (!it.target || !placedSet.has(it.id) || it.id === drag.id) return;
      if (intentFor(drag.id, it.id, drig)) validTargets.add(it.id);
      if (it.id === "incubator" && drag.id.startsWith("dish-") && canIncubate(drig)) validTargets.add(it.id);
    });
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-slate-800 select-none" style={{ background: "#ececec" }}>
      <header className="z-30 flex items-center gap-3 border-b border-slate-300/70 bg-white/85 px-3 py-2 backdrop-blur">
        <button onClick={() => router.push("/")} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">←</button>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide text-slate-800">{tg("labs.3.title")}</span>
          <span className="text-[11px] text-slate-500">{tg("labs.3.subtitle")} · Lab 3</span>
        </div>

        {!isExam && (
          <div className="mx-auto flex max-w-[46%] items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow">
            <span className="text-teal-300">➜</span>
            <span className="truncate">{tg(hint)}</span>
          </div>
        )}
        {examActive && (
          <div className="mx-auto flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
            <span>📝</span>
            <span>{tg("ui.examBanner")}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {examActive && (
            <button onClick={finishExam} className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-400">✓ Yakunlash</button>
          )}
          <LanguageSwitcher />
          <button onClick={restart} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">↻ {tg("common.restart")}</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && !(isExam && examPhase === "planning") && (
          <Lab3Sidebar state={drig} placed={sidebarPlaced} draggingId={drag?.id ?? null} onStartDrag={startDrag} showHints={!isExam} />
        )}

        <div ref={tableRef} className="relative flex-1 overflow-hidden" style={{ background: "linear-gradient(180deg,#ededed 0%,#e6e6e6 55%,#8f8f8f 55%,#9a9a9a 100%)" }}>
          <button onClick={() => setSidebarOpen((o) => !o)} className="absolute left-2 top-1/2 z-40 grid h-14 w-7 -translate-y-1/2 place-items-center rounded-lg bg-white/90 text-xl font-bold text-slate-600 shadow-md transition hover:bg-white">
            {sidebarOpen ? "‹" : "›"}
          </button>

          {isExam && examPhase === "planning" && (
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-slate-500/10">
              <p className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-medium text-slate-500 shadow">{tg("ui.planFirst")}</p>
            </div>
          )}
          {movableCount === 0 && !drag && !isExam && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-2xl bg-white/70 px-5 py-3 text-sm font-medium text-slate-500 shadow">{tg("ui.dragToTable")}</p>
            </div>
          )}

          {LAB3_ITEMS.filter((it) => placedSet.has(it.id)).map((it) => {
            const pos = placed[it.id];
            const isValid = validTargets.has(it.id);
            const isHover = hoverTarget === it.id;
            return (
              <div key={it.id} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)", opacity: drag?.id === it.id ? 0.35 : 1 }}>
                {(isValid || isHover) && (
                  <div
                    className="pointer-events-none absolute rounded-xl"
                    style={{
                      ...(it.hitW != null
                        ? { left: it.w / 2 + (it.hitDX ?? 0) - it.hitW / 2, top: it.h / 2 + (it.hitDY ?? 0) - (it.hitH ?? it.h) / 2, width: it.hitW, height: it.hitH ?? it.h }
                        : { inset: -12 }),
                      border: `2px dashed ${isHover ? "#0ea5a0" : "#5eead4"}`,
                      boxShadow: isHover ? "0 0 18px rgba(13,148,160,0.45)" : "none",
                      animation: "wbZonePulse 1.4s ease-in-out infinite",
                    }}
                  />
                )}
                <div
                  onPointerDown={it.fixed ? undefined : (e) => {
                    e.preventDefault();
                    startDrag(it.id, e);
                  }}
                  onDoubleClick={
                    it.fixed
                      ? undefined
                      : () =>
                          setPlaced((p) => {
                            const n = { ...p };
                            delete n[it.id];
                            return n;
                          })
                  }
                  style={{ cursor: it.fixed ? "default" : "grab" }}
                  title={tg(it.label)}
                >
                  {it.id === "spatula" && (spatulaInAlcohol || spatulaInChlorine) ? (
                    // Working (triangular) end DOWN, submerged in the liquid; the
                    // long handle sticks up out of the jar.
                    <div style={{ transform: "rotate(-82deg)", transition: "transform 0.15s ease" }}>{it.render(drig, renderOpts)}</div>
                  ) : (
                    it.render(drig, renderOpts)
                  )}
                </div>
              </div>
            );
          })}

          {/* Front face of the test-tube rack — painted over the seated suspension
              tube so it reads as passing THROUGH the hole, not in front of it. */}
          {tubeInRack && placed["rack"] && (
            <div className="pointer-events-none absolute" style={{ left: `${placed["rack"].x}%`, top: `${placed["rack"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
              <TestTubeRack width={340} front />
            </div>
          )}
          {/* Front glass + liquid of the alcohol jar — painted over the dipped spreader. */}
          {spatulaInAlcohol && placed["alcohol-jar"] && (
            <div className="pointer-events-none absolute" style={{ left: `${placed["alcohol-jar"].x}%`, top: `${placed["alcohol-jar"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
              <AlcoholJar width={110} variant="alcohol" front />
            </div>
          )}
          {/* Front glass of the chlorine jar — over the discarded used spreader. */}
          {spatulaInChlorine && placed["chlorine-jar"] && (
            <div className="pointer-events-none absolute" style={{ left: `${placed["chlorine-jar"].x}%`, top: `${placed["chlorine-jar"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
              <AlcoholJar width={110} variant="chlorine" front />
            </div>
          )}

          {/* Spreading: a wet glossy sheen + raking streaks build on the plate */}
          {hold?.kind === "rub" && hold.intent.startsWith("spread-") && placed[hold.target] && (
            <div className="pointer-events-none absolute z-20" style={{ left: `${placed[hold.target].x}%`, top: `${placed[hold.target].y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="132" height="132" viewBox="0 0 132 132">
                <circle cx="66" cy="66" r="50" fill="#f0eece" opacity={0.3 * hold.progress} />
                {[0, 1, 2].map((i) => (
                  <path
                    key={i}
                    d={`M 26 ${50 + i * 16} Q 66 ${40 + i * 16} 106 ${50 + i * 16}`}
                    stroke="#f4f1cf"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={84}
                    strokeDashoffset={84 * (1 - Math.max(0, Math.min(1, hold.progress * 1.5 - i * 0.22)))}
                    opacity="0.85"
                  />
                ))}
                <ellipse cx="48" cy="52" rx="22" ry="8" fill="#ffffff" opacity={0.32 * hold.progress} />
              </svg>
            </div>
          )}

          {/* Material drip from the pipette onto plate 1 */}
          {fx && fx.kind === "drip-mat" && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 8}%` }}>
              <Drop trigger={fx.key} color="#cfe0d6" fallHeight={60} />
            </div>
          )}
          {/* Match strike spark on the box */}
          {fx?.kind === "spark" && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.line
                    key={i}
                    x1="30"
                    y1="30"
                    x2={30 + 16 * Math.cos((i / 6) * Math.PI * 2)}
                    y2={30 + 16 * Math.sin((i / 6) * Math.PI * 2)}
                    stroke="#fbbf24"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ opacity: 0.9, pathLength: 0 }}
                    animate={{ opacity: 0, pathLength: 1 }}
                    transition={{ duration: 0.45, delay: i * 0.02 }}
                  />
                ))}
              </svg>
            </div>
          )}
          {/* Jar dip — expanding ripple rings on the liquid surface */}
          {(fx?.kind === "dip" || fx?.kind === "dip-chlorine") && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 18}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="90" height="40" viewBox="0 0 90 40">
                {[0, 1, 2].map((i) => (
                  <motion.ellipse
                    key={i}
                    cx="45"
                    cy="20"
                    initial={{ rx: 5, ry: 2, opacity: 0.7 }}
                    animate={{ rx: 26, ry: 9, opacity: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.18, ease: "easeOut" }}
                    fill="none"
                    stroke={fx.kind === "dip-chlorine" ? "#c4d98a" : "#bfe0ee"}
                    strokeWidth="1.6"
                  />
                ))}
                <motion.circle cx="45" cy="18" r="2.5" initial={{ y: -10, opacity: 0.9 }} animate={{ y: 0, opacity: 0 }} transition={{ duration: 0.35 }} fill={fx.kind === "dip-chlorine" ? "#d6e6a0" : "#cfe6f0"} />
              </svg>
            </div>
          )}

          {/* Incubation countdown */}
          {inc && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-40 -translate-x-1/2">
              <HourglassWait
                progress={incProg}
                title={tg("lab3.inc.title")}
                time={tg("lab3.inc.remain", { h: tg("lab3.hours", { h: Math.max(0, Math.ceil(DISPLAY_INCUBATE_HOURS * (1 - incProg))) }) })}
              />
            </div>
          )}

          {/* Result button (learn mode) — the plates are out of the thermostat. */}
          {!isExam && drig.incubated && !learnResultOpen && (
            <button onClick={() => setLearnResultOpen(true)} className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-500">
              📋 {tg("lab3.learn.viewBtn")}
            </button>
          )}

          {/* Drag ghost */}
          {drag && draggingDef && (
            <div className="pointer-events-none fixed z-50" style={{ left: drag.px, top: drag.py, transform: "translate(-50%,-50%) scale(1.06)", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
              {draggingDef.render(drig, renderOpts)}
            </div>
          )}

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

      <AnimatePresence>{mode === null && <ModeSelect onPick={setMode} />}</AnimatePresence>

      <AnimatePresence>
        {isExam && examPhase === "result" && examResult && (
          <Lab3ResultModal result={examResult} onRestart={restart} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExam && learnResultOpen && (
          <Lab3LearnResult onRestart={restart} onClose={() => setLearnResultOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
