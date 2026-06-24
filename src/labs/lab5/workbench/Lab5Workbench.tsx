"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Drop } from "@/labs/lab1/components2d/animations/Drop";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { BacterialLoop } from "@/labs/lab1/components2d/items/BacterialLoop";
import { FilterPaper } from "@/labs/lab1/components2d/items/FilterPaper";
import { LoopStand } from "@/labs/lab1/components2d/items/LoopStand";
import { CoverSlip } from "../components2d/items/CoverSlip";
import { LAB5_ITEMS, LAB5_ITEM_BY_ID, intentFor, type Lab5ItemId } from "./items";
import { freshWetMountState, applyWetStep, canObserve, dropStage, type WetMountState, type WetIntent } from "../state";
import { type LabMode, type ExamPhase } from "../exam/protocol";
import { scoreWetMountExam, type ExamAction, type ExamResult } from "../exam/scoring";
import { Lab5Sidebar } from "./Lab5Sidebar";
import { ModeSelect } from "./ModeSelect";
import { PlanningSidebar } from "./PlanningSidebar";
import { Lab5ResultModal } from "../components2d/Lab5ResultModal";
import { WetMountMicroscopeModal } from "../components2d/WetMountMicroscopeModal";

const DROP_PAD = 26;
const GHOST_SCALE = 1.06;
const LOOP_COOL_MS = 3000;
const TICK = 70;
const SAMPLE_DUR = 1400;
const RUB_K = 0.0018;

type Kind = "rub" | "sample" | "contact" | "instant";
interface DragState {
  id: Lab5ItemId;
  fromSidebar: boolean;
  px: number;
  py: number;
}
interface Hold {
  kind: Kind;
  intent: WetIntent;
  target: Lab5ItemId;
  progress: number;
}
interface Fx {
  kind: "drip-saline" | "spark";
  x: number;
  y: number;
  key: number;
}

const SAMPLE_INTENTS: WetIntent[] = ["charge-loop", "degrease-slide", "place-cover", "blot-excess"];

/** Render stacking on the bench. Stations (tray/bridge/rack/loop-stand) sit
 *  under the pieces they hold; the seated tube/loop render in FRONT of their
 *  stand's back but BEHIND its front overlay (z5). */
const Z_STACK: Partial<Record<Lab5ItemId, number>> = { tray: 0, bridge: 1, rack: 1, "loop-stand": 1, culture: 3, loop: 3, slide: 4 };
const zOf = (id: Lab5ItemId) => Z_STACK[id] ?? 2;

function actionKind(intent: WetIntent): Kind {
  // Mirrors Lab 1: strike the match with a rub on the box; bin it on release.
  if (intent === "mix-drop" || intent === "strike-match") return "rub";
  if (SAMPLE_INTENTS.includes(intent)) return "sample";
  if (intent === "observe" || intent === "discard-match") return "instant";
  return "contact"; // light lamp, flame-loop, apply-saline, blot-excess
}

function nextHint(s: WetMountState): string {
  if (!s.lamp.lit) return s.match.struck ? "lab5.hint.lightLamp" : "lab5.hint.strikeMatch";
  if (!s.match.discarded) return "lab5.hint.discardMatch";
  if (!s.slideDegreased) return "lab5.hint.degrease";
  if (!s.salineApplied) return "lab5.hint.saline";
  if (!s.loopFlamed && !s.loopCharged) return "lab5.hint.flame";
  if (!s.loopCharged && !s.mixed) return "lab5.hint.charge";
  if (!s.mixed) return "lab5.hint.mix";
  if (!s.loopResterilized) return "lab5.hint.reflame"; // flame the used loop right after the smear
  if (!s.coverPlaced) return "lab5.hint.cover";
  if (!s.blotted) return "lab5.hint.blot";
  if (!s.observed) return "lab5.hint.observe";
  return "lab5.hint.done";
}

export function Lab5Workbench() {
  const router = useRouter();
  const tg = useTranslations();
  const [wet, setWet] = useState<WetMountState>(() => freshWetMountState());
  const wetRef = useRef(wet);
  wetRef.current = wet;

  const tableRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Record<string, { x: number; y: number }>>({});
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const lastPtr = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [hoverTarget, setHoverTarget] = useState<Lab5ItemId | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const holdRef = useRef<Hold | null>(null);
  holdRef.current = hold;
  const holdIv = useRef<number | null>(null);
  const lockTargetRef = useRef<Lab5ItemId | null>(null);

  const [fx, setFx] = useState<Fx | null>(null);
  const fxKey = useRef(0);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loopHot, setLoopHot] = useState(false);
  const [binBump, setBinBump] = useState(0);

  const [mode, setMode] = useState<LabMode | null>(null);
  const modeRef = useRef<LabMode | null>(null);
  modeRef.current = mode;
  const [examPhase, setExamPhase] = useState<ExamPhase>("planning");
  const [actionLog, setActionLog] = useState<ExamAction[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  const [scopeOpen, setScopeOpen] = useState(false);

  const isExam = mode === "exam";
  const examActive = isExam && examPhase === "execution";

  const flashAt = useCallback((kind: Fx["kind"], x: number, y: number, ms = 1000) => {
    fxKey.current += 1;
    const k = fxKey.current;
    setFx({ kind, x, y, key: k });
    window.setTimeout(() => setFx((f) => (f && f.key === k ? null : f)), ms);
  }, []);
  const showToast = useCallback((msg: string, ok = false, ms = 1900) => {
    setToast({ msg, ok });
    window.setTimeout(() => setToast(null), ms);
  }, []);
  const recordAction = useCallback((intent: string) => {
    setActionLog((log) => [...log, { intent, ts: Date.now() }]);
  }, []);

  useEffect(() => {
    if (!loopHot) return;
    const t = window.setTimeout(() => setLoopHot(false), LOOP_COOL_MS);
    return () => window.clearTimeout(t);
  }, [loopHot]);

  function perform(intent: WetIntent) {
    const at = (id: string) => {
      const p = placedRef.current[id];
      return { x: p?.x ?? 50, y: p?.y ?? 50 };
    };
    if (intent === "observe") {
      setWet((g) => applyWetStep(g, "observe"));
      recordAction("observe");
      setScopeOpen(true);
      return;
    }
    setWet((g) => applyWetStep(g, intent));
    recordAction(intent);
    if (intent === "flame-loop") setLoopHot(true);
    else if (intent === "strike-match") flashAt("spark", at("matchbox").x, at("matchbox").y, 700);
    else if (intent === "discard-match") {
      setBinBump((b) => b + 1);
      setPlaced((p) => { const n = { ...p }; delete n["match"]; return n; });
    } else if (intent === "apply-saline") flashAt("drip-saline", at("slide").x, at("slide").y - 6, 900);
  }

  function hitPoint(d: DragState, clientX: number, clientY: number) {
    const def = LAB5_ITEM_BY_ID[d.id];
    return { hx: clientX + (def.tipX ?? 0) * GHOST_SCALE, hy: clientY + (def.tipY ?? 0) * GHOST_SCALE };
  }

  const targetAt = useCallback((px: number, py: number, exclude: Lab5ItemId): Lab5ItemId | null => {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    for (const [id, pos] of Object.entries(placedRef.current)) {
      const itemId = id as Lab5ItemId;
      if (itemId === exclude) continue;
      const def = LAB5_ITEM_BY_ID[itemId];
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

  const startDrag = useCallback((id: Lab5ItemId, e: React.PointerEvent) => {
    const fromSidebar = !placedRef.current[id];
    lastPtr.current = { x: e.clientX, y: e.clientY };
    setDrag({ id, fromSidebar, px: e.clientX, py: e.clientY });
  }, []);

  function cancelHold() {
    if (holdIv.current != null) {
      window.clearInterval(holdIv.current);
      holdIv.current = null;
    }
    holdRef.current = null;
    setHold(null);
  }
  function completeAction(intent: WetIntent, target: Lab5ItemId) {
    perform(intent);
    cancelHold();
    lockTargetRef.current = target;
  }
  function startTimed(target: Lab5ItemId, intent: WetIntent, duration: number) {
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
      const tg = targetAt(hx - rect.left, hy - rect.top, d.id);
      const intent = tg ? intentFor(d.id, tg, wetRef.current) : null;
      setHoverTarget(intent ? tg : null);

      const h = holdRef.current;
      if (lockTargetRef.current && tg !== lockTargetRef.current) lockTargetRef.current = null;

      if (!intent || !tg) {
        if (h) cancelHold();
        return;
      }
      // Taking culture needs the flamed loop to cool first.
      if (intent === "charge-loop" && loopHot) {
        if (h) cancelHold();
        return;
      }
      if (lockTargetRef.current === tg) return;

      const kind = actionKind(intent);
      if (kind === "contact") {
        if (h) cancelHold();
        perform(intent);
        lockTargetRef.current = tg;
        return;
      }
      if (kind === "instant") {
        if (h) cancelHold();
        return; // fires on release
      }
      if (kind === "sample") {
        if (!h || h.target !== tg || h.kind !== "sample") startTimed(tg, intent, SAMPLE_DUR);
        return;
      }
      // rub (mix)
      if (!h || h.target !== tg || h.kind !== "rub") {
        const nh: Hold = { kind: "rub", target: tg, intent, progress: 0 };
        holdRef.current = nh;
        setHold(nh);
      } else {
        const np = h.progress + Math.hypot(dx, dy) * RUB_K;
        if (np >= 1) completeAction(intent, tg);
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
  }, [drag?.id, loopHot]);

  function endDrag() {
    setDrag(null);
    setHoverTarget(null);
  }

  function snapPos(id: Lab5ItemId, rect: DOMRect, fallback: { x: number; y: number }): { x: number; y: number } {
    const p = placedRef.current;
    if (id === "bridge" && p["tray"]) return { x: p["tray"].x, y: p["tray"].y };
    if (id === "slide" && p["bridge"]) return { x: p["bridge"].x, y: p["bridge"].y };
    if (id === "loop" && p["loop-stand"]) return { x: p["loop-stand"].x, y: p["loop-stand"].y + (-55 / rect.height) * 100 };
    if (id === "culture" && p["rack"]) return { x: p["rack"].x, y: p["rack"].y + (-59.5 / rect.height) * 100 };
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

    const { hx, hy } = hitPoint(d, e.clientX, e.clientY);
    const target = targetAt(hx - rect.left, hy - rect.top, d.id);

    // The cover slip is ALWAYS consumed onto the slide — never laid loose on the
    // table. (place-cover is a "contact" action: it can fire mid-drag, after
    // which intentFor() returns null on release; without this guard the slip
    // would then fall through to table placement and re-appear on the bench.)
    if (d.id === "coverslip") {
      if (target === "slide" && wetRef.current.mixed && wetRef.current.loopResterilized && !wetRef.current.coverPlaced) perform("place-cover");
      endDrag();
      return;
    }

    // Slide → microscope: open the eyepiece view.
    if (target === "microscope" && d.id === "slide") {
      if (canObserve(wetRef.current)) perform("observe");
      else if (!wetRef.current.coverPlaced) showToast(tg("lab5.toast.needPrep"));
      endDrag();
      return;
    }

    if (target) {
      const intent = intentFor(d.id, target, wetRef.current);
      if (intent) {
        // Instant + contact actions also fire on RELEASE so a tool dropped on its
        // target (e.g. the NaCl bottle on the slide) always works — even if the
        // tip never registered mid-drag. Re-evaluated state means no double-fire.
        const k = actionKind(intent);
        if (k === "instant" || k === "contact") perform(intent);
        // The cover slip is consumed onto the slide; the spent match drops into
        // the bin — neither is laid back down on the table.
        if (intent === "place-cover" || intent === "discard-match") {
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

    const fxp = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const fyp = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    let pos = snapPos(d.id, rect, { x: fxp, y: fyp });
    if (d.id === "slide" && !placedRef.current["bridge"]) {
      showToast(tg("lab5.toast.needBridge"));
      pos = { x: fxp, y: fyp };
    }
    setPlaced((p) => ({ ...p, [d.id]: pos }));
    if (d.id === "slide" && !wetRef.current.slidePlaced) setWet((g) => ({ ...g, slidePlaced: true }));
    endDrag();
  }

  function closeScope() {
    setScopeOpen(false);
    if (modeRef.current === "exam") {
      // Observing the living, motile wet mount is the final exam step.
      finishExam();
    } else if (wetRef.current.observed) {
      // Learn mode is for practice — no grade. Just a completion message.
      showToast(tg("lab5.toast.success"), true, 3600);
    }
  }
  function startExam() {
    setExamPhase("execution");
  }
  function finishExam() {
    setExamResult(scoreWetMountExam(actionLog, wetRef.current));
    setExamPhase("result");
  }
  function restart() {
    setWet(freshWetMountState());
    setPlaced({});
    setActionLog([]);
    setExamResult(null);
    setLoopHot(false);
    cancelHold();
    lockTargetRef.current = null;
    setScopeOpen(false);
    setExamPhase("planning");
    setMode(null);
  }

  const placedSet = new Set(Object.keys(placed)) as Set<Lab5ItemId>;
  const draggingDef = drag ? LAB5_ITEM_BY_ID[drag.id] : null;
  const hint = nextHint(wet);

  const degreasing = hold?.kind === "sample" && hold.intent === "degrease-slide";
  const charging = hold?.kind === "sample" && hold.intent === "charge-loop";
  const covering = hold?.kind === "sample" && hold.intent === "place-cover";
  const blotting = hold?.kind === "sample" && hold.intent === "blot-excess";
  const mixing = hold?.kind === "rub" && hold.intent === "mix-drop" ? hold : null;

  const renderOpts = { loopHeat: loopHot ? 1 : 0, slideWarming: degreasing, tubePlugOff: charging, filterWet: wet.blotted, binBump };
  const slidePos = placed["slide"];
  const culturePos = placed["culture"];
  const tubeInRack = !!placed["culture"] && !!placed["rack"] && Math.abs(placed["culture"].x - placed["rack"].x) < 2;
  const loopOnStand = !!placed["loop"] && !!placed["loop-stand"] && Math.abs(placed["loop"].x - placed["loop-stand"].x) < 2;

  const validTargets = new Set<Lab5ItemId>();
  if (drag) {
    LAB5_ITEMS.forEach((it) => {
      if (!it.target || !placedSet.has(it.id) || it.id === drag.id) return;
      if (intentFor(drag.id, it.id, wet)) validTargets.add(it.id);
      if (it.id === "microscope" && drag.id === "slide" && canObserve(wet)) validTargets.add(it.id);
    });
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-slate-800 select-none" style={{ background: "#ececec" }}>
      <header className="z-30 flex items-center gap-3 border-b border-slate-300/70 bg-white/85 px-3 py-2 backdrop-blur">
        <button onClick={() => router.push("/")} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">←</button>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide text-slate-800">{tg("labs.5.title")}</span>
          <span className="text-[11px] text-slate-500">{tg("labs.5.subtitle")} · Lab 5</span>
        </div>

        {!isExam && (
          <div className="mx-auto flex max-w-[46%] items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow">
            <span className="text-amber-300">➜</span>
            <span className="truncate">{tg(hint)}</span>
          </div>
        )}
        {examActive && (
          <div className="mx-auto flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
            <span>📝</span>
            <span>{tg("ui.examBanner")}</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={restart} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">↻ {tg("common.restart")}</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && !(isExam && examPhase === "planning") && (
          <Lab5Sidebar state={wet} placed={placedSet} draggingId={drag?.id ?? null} onStartDrag={startDrag} showHints={!isExam} />
        )}

        <div ref={tableRef} className="wb-surface relative flex-1 overflow-hidden" style={{ background: "linear-gradient(180deg,#ededed 0%,#e6e6e6 55%,#8f8f8f 55%,#9a9a9a 100%)" }}>
          <button onClick={() => setSidebarOpen((o) => !o)} className="absolute left-2 top-1/2 z-40 grid h-14 w-7 -translate-y-1/2 place-items-center rounded-lg bg-white/90 text-xl font-bold text-slate-600 shadow-md transition hover:bg-white">
            {sidebarOpen ? "‹" : "›"}
          </button>

          {isExam && examPhase === "planning" && (
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-slate-500/10">
              <p className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-medium text-slate-500 shadow">{tg("ui.planFirst")}</p>
            </div>
          )}
          {placedSet.size === 0 && !drag && !isExam && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-2xl bg-white/70 px-5 py-3 text-sm font-medium text-slate-500 shadow">{tg("ui.dragToTable")}</p>
            </div>
          )}

          {LAB5_ITEMS.filter((it) => placedSet.has(it.id)).sort((a, b) => zOf(a.id) - zOf(b.id)).map((it) => {
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
                      border: `2px dashed ${isHover ? "#d97706" : "#fbbf24"}`,
                      boxShadow: isHover ? "0 0 18px rgba(217,119,6,0.45)" : "none",
                      animation: "wbZonePulse 1.4s ease-in-out infinite",
                    }}
                  />
                )}
                <div
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startDrag(it.id, e);
                  }}
                  onDoubleClick={() => setPlaced((p) => { const n = { ...p }; delete n[it.id]; return n; })}
                  style={{ cursor: "grab" }}
                  title={tg(it.label)}
                >
                  {it.id === "loop" && loopOnStand ? (
                    <div style={{ transform: "rotate(90deg)", transition: "transform 0.12s ease" }}>{it.render(wet, renderOpts)}</div>
                  ) : (
                    it.render(wet, renderOpts)
                  )}
                </div>
                {/* Re-cap the lamp by hand to put it out (click the cap). */}
                {it.id === "lamp" && wet.lamp.lit && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      perform("extinguish-lamp");
                    }}
                    title={tg("lab5.extinguish")}
                    className="absolute right-0 top-0 z-30 grid h-7 w-7 place-items-center rounded-full bg-slate-700/90 text-[13px] text-white shadow ring-1 ring-white/40 transition hover:bg-slate-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}

          {/* Front of the rack over the seated culture tube (3-layer occlusion) */}
          {tubeInRack && placed["rack"] && (
            <div className="pointer-events-none absolute" style={{ left: `${placed["rack"].x}%`, top: `${placed["rack"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
              <TestTubeRack width={340} front />
            </div>
          )}

          {/* Front of the loop-stand sleeves over the seated (vertical) loop */}
          {loopOnStand && placed["loop-stand"] && (
            <div className="pointer-events-none absolute" style={{ left: `${placed["loop-stand"].x}%`, top: `${placed["loop-stand"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
              <LoopStand width={200} front />
            </div>
          )}

          {/* Mixing swirl building on the drop during the rub */}
          {mixing && slidePos && (
            <div className="pointer-events-none absolute z-20" style={{ left: `${slidePos.x}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="60" height="48" viewBox="0 0 60 48" style={{ overflow: "visible" }}>
                <ellipse cx="34" cy="24" rx={9 + 6 * mixing.progress} ry={7 + 4 * mixing.progress} fill="#d8d6bd" opacity={0.5 * mixing.progress} />
                <path d={`M 34 24 m -8 0 a 8 6 0 1 0 16 0 a 6 4 0 1 0 -12 0`} stroke="#a9a884" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray={60} strokeDashoffset={60 * (1 - mixing.progress)} opacity="0.7" />
              </svg>
              <div className="absolute left-1/2 top-[-26px] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow">{tg("lab5.act.mixing")}</div>
            </div>
          )}

          {/* Cover slip lowering exactly onto the slide centre (tilts down flat) */}
          {covering && slidePos && (
            <div className="pointer-events-none absolute z-40" style={{ left: `${slidePos.x}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)" }}>
              <motion.div
                style={{ transformOrigin: "50% 100%" }}
                initial={{ rotate: -32, y: -24, opacity: 0 }}
                animate={{ rotate: [-32, 0, 0], y: [-24, 0, 0], opacity: 1 }}
                transition={{ duration: SAMPLE_DUR / 1000, times: [0, 0.72, 1], ease: "easeInOut" }}
              >
                <CoverSlip width={42} />
              </motion.div>
              <div className="absolute left-1/2 top-[-38px] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow">{tg("lab5.act.covering")}</div>
            </div>
          )}

          {/* Charging the loop — it swings VERTICAL and lowers its ring down
              through the open tube mouth onto the slant-agar growth, then lifts. */}
          {charging && culturePos && (
            <>
              <div className="pointer-events-none absolute z-40" style={{ left: `${culturePos.x}%`, top: `${culturePos.y}%`, transform: "translate(-50%,-50%)" }}>
                <motion.div
                  style={{ transformOrigin: "center center" }}
                  initial={{ rotate: -46, y: -150, opacity: 0 }}
                  animate={{ rotate: -90, y: [-150, -40, -40, -150], opacity: 1 }}
                  transition={{ duration: SAMPLE_DUR / 1000, times: [0, 0.32, 0.78, 1], ease: "easeInOut" }}
                >
                  <BacterialLoop heatLevel={0} />
                </motion.div>
              </div>
              <div className="pointer-events-none absolute z-40 -translate-x-1/2 rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow" style={{ left: `${culturePos.x}%`, top: `${culturePos.y + 18}%` }}>
                {tg("lab5.act.charging")}
              </div>
            </>
          )}

          {/* Blotting excess — filter paper dabs onto the slide; a drop of excess
              saline is squeezed out and DRIPS DOWN from the slide edge, and a wet
              stain visibly spreads through the filter paper. */}
          {blotting && slidePos && (
            <div className="pointer-events-none absolute z-40" style={{ left: `${slidePos.x}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)" }}>
              {/* excess drops squeezed out at the slide edges, dripping DOWN */}
              {[-1, 1].map((side) => (
                <motion.div
                  key={side}
                  className="absolute"
                  style={{ left: "50%", top: 12, marginLeft: side * 46, width: 6, height: 9, borderRadius: "50% 50% 50% 50% / 62% 62% 38% 38%", background: "rgba(150,200,228,0.95)", boxShadow: "0 0 3px rgba(150,200,228,0.7)" }}
                  initial={{ opacity: 0, y: -2, scaleY: 0.6 }}
                  animate={{ opacity: [0, 1, 1, 0], y: [-2, 8, 26, 40], scaleY: [0.6, 1, 1.1, 1.2] }}
                  transition={{ duration: SAMPLE_DUR / 1000, times: [0, 0.25, 0.7, 1], ease: "easeIn", delay: side > 0 ? 0.15 : 0 }}
                />
              ))}
              <div className="relative">
                <motion.div
                  style={{ transformOrigin: "50% 100%" }}
                  initial={{ y: -26, opacity: 0 }}
                  animate={{ y: [-26, -2, -12, -2, -26], opacity: 1 }}
                  transition={{ duration: SAMPLE_DUR / 1000, times: [0, 0.25, 0.5, 0.75, 1], ease: "easeInOut" }}
                >
                  <FilterPaper width={56} wet />
                  {/* wet stain soaking through the filter paper */}
                  <motion.div
                    className="absolute left-1/2 top-1/2 rounded-full"
                    style={{ transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(120,175,205,0.6), rgba(150,200,228,0.25) 70%, transparent)" }}
                    initial={{ width: 4, height: 4, opacity: 0 }}
                    animate={{ width: [4, 34, 42], height: [4, 30, 38], opacity: [0, 0.75, 0.7] }}
                    transition={{ duration: SAMPLE_DUR / 1000, times: [0, 0.55, 1], ease: "easeOut" }}
                  />
                </motion.div>
              </div>
              <div className="absolute left-1/2 top-[-30px] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow">{tg("lab5.act.blotting")}</div>
            </div>
          )}

          {/* Saline drop falling onto the slide */}
          {fx?.kind === "drip-saline" && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 8}%` }}>
              <Drop trigger={fx.key} color="#bfe0ec" fallHeight={54} />
            </div>
          )}
          {/* Match strike spark on the box */}
          {fx?.kind === "spark" && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.line key={i} x1="30" y1="30" x2={30 + 16 * Math.cos((i / 6) * Math.PI * 2)} y2={30 + 16 * Math.sin((i / 6) * Math.PI * 2)} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" initial={{ opacity: 0.9, pathLength: 0 }} animate={{ opacity: 0, pathLength: 1 }} transition={{ duration: 0.45, delay: i * 0.02 }} />
                ))}
              </svg>
            </div>
          )}

          {/* No microscope button — the student carries the slide to the
              microscope and drops it there to read the prep. */}

          {/* Drag ghost — hidden while a dedicated dip/dab animation plays. */}
          {drag && draggingDef && !covering && !charging && !blotting && (
            <div className="pointer-events-none fixed z-50" style={{ left: drag.px, top: drag.py, transform: "translate(-50%,-50%) scale(1.06)", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
              {draggingDef.render(wet, renderOpts)}
            </div>
          )}

          <AnimatePresence>
            {toast && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg" style={{ background: toast.ok ? "rgba(5,150,105,0.96)" : "rgba(225,29,72,0.95)" }}>
                {toast.msg}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {isExam && examPhase === "planning" && <PlanningSidebar onStart={startExam} />}
      </div>

      <WetMountMicroscopeModal open={scopeOpen} onClose={closeScope} />

      <AnimatePresence>{mode === null && <ModeSelect onPick={setMode} />}</AnimatePresence>

      <AnimatePresence>
        {isExam && examPhase === "result" && examResult && (
          <Lab5ResultModal result={examResult} onRestart={restart} />
        )}
      </AnimatePresence>
    </div>
  );
}
