"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Drop } from "@/labs/lab1/components2d/animations/Drop";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { CoverSlip } from "../components2d/items/CoverSlip";
import { LAB5_ITEMS, LAB5_ITEM_BY_ID, intentFor, type Lab5ItemId } from "./items";
import { freshWetMountState, applyWetStep, canObserve, dropStage, SPECIMEN, type WetMountState, type WetIntent, type Motility } from "../state";
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
  kind: "drip-saline";
  x: number;
  y: number;
  key: number;
}

const SAMPLE_INTENTS: WetIntent[] = ["charge-loop", "degrease-slide", "place-cover"];

function actionKind(intent: WetIntent): Kind {
  if (intent === "mix-drop") return "rub";
  if (SAMPLE_INTENTS.includes(intent)) return "sample";
  if (intent === "observe") return "instant";
  return "contact"; // flame-loop, apply-saline, blot-excess
}

function nextHint(s: WetMountState): string {
  if (!s.slideDegreased) return "Buyum oynasini spirtovka olovidan o'tkazib yog'sizlantiring";
  if (!s.salineApplied) return "Oyna markaziga fiziologik eritma (NaCl) tomchisini tomizing";
  if (!s.loopFlamed && !s.loopCharged) return "Bakteriologik halqani olovda qizdirib sterillang";
  if (!s.loopCharged && !s.mixed) return "Sovugan halqa bilan kulturadan yengil teginib oling";
  if (!s.mixed) return "Halqadagi kulturani tomchiga bir tekis bo'lguncha aralashtiring";
  if (!s.coverPlaced) return "Tomchini qoplag'ich oyna bilan yoping (qirrasidan asta tushiring)";
  if (!s.blotted) return "Ortiqcha suyuqlikni filtr qog'oz bilan oling";
  if (!s.observed) return "Preparatni mikroskopga olib borib ×40 obyektivda ko'ring";
  return "Bakteriya harakatchanligini aniqlang";
}

export function Lab5Workbench() {
  const router = useRouter();
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
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loopHot, setLoopHot] = useState(false);

  const [mode, setMode] = useState<LabMode | null>(null);
  const modeRef = useRef<LabMode | null>(null);
  modeRef.current = mode;
  const [examPhase, setExamPhase] = useState<ExamPhase>("planning");
  const [actionLog, setActionLog] = useState<ExamAction[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [learnResult, setLearnResult] = useState<ExamResult | null>(null);

  const [scopeOpen, setScopeOpen] = useState(false);
  const [reveal, setReveal] = useState(false);

  const isExam = mode === "exam";
  const examActive = isExam && examPhase === "execution";

  const flashAt = useCallback((kind: Fx["kind"], x: number, y: number, ms = 1000) => {
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
      setReveal(false);
      setScopeOpen(true);
      return;
    }
    setWet((g) => applyWetStep(g, intent));
    recordAction(intent);
    if (intent === "flame-loop") setLoopHot(true);
    else if (intent === "apply-saline") flashAt("drip-saline", at("slide").x, at("slide").y - 6, 900);
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

    // Slide → microscope: open the eyepiece view.
    if (target === "microscope" && d.id === "slide") {
      if (canObserve(wetRef.current)) perform("observe");
      else if (!wetRef.current.coverPlaced) showToast("Avval preparatni tayyorlab, qoplag'ich oyna bilan yoping");
      endDrag();
      return;
    }

    if (target) {
      const intent = intentFor(d.id, target, wetRef.current);
      if (intent) {
        if (actionKind(intent) === "instant") perform(intent);
        // The cover slip is consumed onto the slide (not laid on the table).
        if (intent === "place-cover") {
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
      showToast("Avval shisha ko'prikni stolga qo'ying");
      pos = { x: fxp, y: fyp };
    }
    setPlaced((p) => ({ ...p, [d.id]: pos }));
    if (d.id === "slide" && !wetRef.current.slidePlaced) setWet((g) => ({ ...g, slidePlaced: true }));
    endDrag();
  }

  function classifyMotility(m: Motility) {
    setWet((g) => ({ ...g, motilePick: m }));
    if (modeRef.current === "exam") {
      setScopeOpen(false);
      finishExam(m);
    } else {
      setReveal(true);
    }
  }
  function closeScope() {
    setScopeOpen(false);
    if (modeRef.current !== "exam" && wetRef.current.motilePick) {
      setLearnResult(scoreWetMountExam(actionLog, wetRef.current));
    }
  }
  function startExam() {
    setExamPhase("execution");
  }
  function finishExam(motile: Motility | null) {
    const next = motile ? { ...wetRef.current, motilePick: motile } : wetRef.current;
    setExamResult(scoreWetMountExam(actionLog, next));
    setExamPhase("result");
  }
  function restart() {
    setWet(freshWetMountState());
    setPlaced({});
    setActionLog([]);
    setExamResult(null);
    setLearnResult(null);
    setLoopHot(false);
    cancelHold();
    lockTargetRef.current = null;
    setScopeOpen(false);
    setReveal(false);
    setExamPhase("planning");
    setMode(null);
  }

  const placedSet = new Set(Object.keys(placed)) as Set<Lab5ItemId>;
  const draggingDef = drag ? LAB5_ITEM_BY_ID[drag.id] : null;
  const hint = nextHint(wet);

  const degreasing = hold?.kind === "sample" && hold.intent === "degrease-slide";
  const charging = hold?.kind === "sample" && hold.intent === "charge-loop";
  const covering = hold?.kind === "sample" && hold.intent === "place-cover";
  const mixing = hold?.kind === "rub" && hold.intent === "mix-drop" ? hold : null;

  const renderOpts = { loopHeat: loopHot ? 1 : 0, slideWarming: degreasing, tubePlugOff: charging, filterWet: wet.blotted };
  const slidePos = placed["slide"];
  const culturePos = placed["culture"];
  const tubeInRack = !!placed["culture"] && !!placed["rack"] && Math.abs(placed["culture"].x - placed["rack"].x) < 2;

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
          <span className="text-sm font-bold tracking-wide text-slate-800">Tirik mikroorganizmlarni o'rganish</span>
          <span className="text-[11px] text-slate-500">«Ezilgan tomchi» preparati · Lab 5</span>
        </div>

        {!isExam && (
          <div className="mx-auto flex max-w-[46%] items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow">
            <span className="text-amber-300">➜</span>
            <span className="truncate">{hint}</span>
          </div>
        )}
        {examActive && (
          <div className="mx-auto flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 ring-1 ring-sky-200">
            <span>📝</span>
            <span>Imtihon — yordam yo'q. Bilganingizcha bajaring.</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {wet.coverPlaced && !wet.observed && (
            <button onClick={() => perform("observe")} className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-amber-500">🔬 Mikroskopda ko'rish</button>
          )}
          <button onClick={restart} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">↻ Qayta</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && !(isExam && examPhase === "planning") && (
          <Lab5Sidebar state={wet} placed={placedSet} draggingId={drag?.id ?? null} onStartDrag={startDrag} showHints={!isExam} />
        )}

        <div ref={tableRef} className="relative flex-1 overflow-hidden" style={{ background: "linear-gradient(180deg,#ededed 0%,#e6e6e6 55%,#8f8f8f 55%,#9a9a9a 100%)" }}>
          <button onClick={() => setSidebarOpen((o) => !o)} className="absolute left-2 top-1/2 z-40 grid h-14 w-7 -translate-y-1/2 place-items-center rounded-lg bg-white/90 text-xl font-bold text-slate-600 shadow-md transition hover:bg-white">
            {sidebarOpen ? "‹" : "›"}
          </button>

          {isExam && examPhase === "planning" && (
            <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-slate-500/10">
              <p className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-medium text-slate-500 shadow">Avval o'ng paneldan ish tartibini tuzing →</p>
            </div>
          )}
          {placedSet.size === 0 && !drag && !isExam && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-2xl bg-white/70 px-5 py-3 text-sm font-medium text-slate-500 shadow">Asboblarni chap paneldan ish stoliga sudrab oling</p>
            </div>
          )}

          {LAB5_ITEMS.filter((it) => placedSet.has(it.id)).map((it) => {
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
                  title={it.label}
                >
                  {it.render(wet, renderOpts)}
                </div>
              </div>
            );
          })}

          {/* Front of the rack over the seated culture tube */}
          {tubeInRack && placed["rack"] && (
            <div className="pointer-events-none absolute" style={{ left: `${placed["rack"].x}%`, top: `${placed["rack"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
              <TestTubeRack width={340} front />
            </div>
          )}

          {/* Mixing swirl building on the drop during the rub */}
          {mixing && slidePos && (
            <div className="pointer-events-none absolute z-20" style={{ left: `${slidePos.x}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="60" height="48" viewBox="0 0 60 48" style={{ overflow: "visible" }}>
                <ellipse cx="34" cy="24" rx={9 + 6 * mixing.progress} ry={7 + 4 * mixing.progress} fill="#d8d6bd" opacity={0.5 * mixing.progress} />
                <path d={`M 34 24 m -8 0 a 8 6 0 1 0 16 0 a 6 4 0 1 0 -12 0`} stroke="#a9a884" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeDasharray={60} strokeDashoffset={60 * (1 - mixing.progress)} opacity="0.7" />
              </svg>
              <div className="absolute left-1/2 top-[-26px] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow">🔄 Aralashtirilyapti…</div>
            </div>
          )}

          {/* Cover slip lowering onto the drop (placed on edge, tilts down flat) */}
          {covering && slidePos && (
            <div className="pointer-events-none absolute z-40" style={{ left: `${slidePos.x + 6}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)" }}>
              <motion.div
                style={{ transformOrigin: "18% 92%" }}
                initial={{ rotate: -40, y: -34, opacity: 0 }}
                animate={{ rotate: [-40, 0, 0], y: [-34, -2, -2], opacity: 1 }}
                transition={{ duration: SAMPLE_DUR / 1000, times: [0, 0.7, 1], ease: "easeInOut" }}
              >
                <CoverSlip width={66} />
              </motion.div>
              <div className="absolute left-1/2 top-[-40px] -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow">🪟 Qoplag'ich oyna tushirilyapti…</div>
            </div>
          )}

          {/* Charging the loop from the culture — plug lifts, badge shows */}
          {charging && culturePos && (
            <div className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ left: `${culturePos.x}%`, top: `${culturePos.y - 18}%` }}>
              <div className="rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow">🧫 Kulturadan olinyapti…</div>
            </div>
          )}

          {/* Saline drop falling onto the slide */}
          {fx?.kind === "drip-saline" && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 8}%` }}>
              <Drop trigger={fx.key} color="#bfe0ec" fallHeight={54} />
            </div>
          )}

          {/* Microscope button (learn) after the cover slip is on */}
          {!isExam && wet.coverPlaced && !wet.observed && (
            <button onClick={() => perform("observe")} className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-500">
              🔬 Mikroskopda (×40) ko'rish
            </button>
          )}

          {/* Drag ghost — hidden while the cover slip is lowering. */}
          {drag && draggingDef && !covering && (
            <div className="pointer-events-none fixed z-50" style={{ left: drag.px, top: drag.py, transform: "translate(-50%,-50%) scale(1.06)", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
              {draggingDef.render(wet, renderOpts)}
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

      <WetMountMicroscopeModal
        open={scopeOpen}
        picked={wet.motilePick}
        reveal={reveal && !isExam}
        correct={SPECIMEN.motility}
        onClassify={classifyMotility}
        onClose={closeScope}
      />

      <AnimatePresence>{mode === null && <ModeSelect onPick={setMode} />}</AnimatePresence>

      <AnimatePresence>
        {isExam && examPhase === "result" && examResult && (
          <Lab5ResultModal result={examResult} onRestart={restart} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isExam && learnResult && (
          <Lab5ResultModal result={learnResult} learn onRestart={restart} onClose={() => setLearnResult(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
