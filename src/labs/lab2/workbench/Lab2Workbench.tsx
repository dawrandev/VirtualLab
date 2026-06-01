"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Drop } from "@/labs/lab1/components2d/animations/Drop";
import { LAB2_ITEMS, LAB2_ITEM_BY_ID, intentFor, type Lab2ItemId } from "./items";
import { freshGramState, applyGramStep, type GramState, type GramIntent } from "../state";
import { SPECIMEN, type LabMode, type ExamPhase } from "../exam/protocol";
import { scoreGramExam, type ExamAction, type ExamResult } from "../exam/scoring";
import { Lab2Sidebar } from "./Lab2Sidebar";
import { ModeSelect } from "./ModeSelect";
import { PlanningSidebar } from "./PlanningSidebar";
import { Lab2ResultModal } from "../components2d/Lab2ResultModal";
import { MicroscopeModal } from "../components2d/MicroscopeModal";

const DROP_PAD = 26;
const GHOST_SCALE = 1.06;

interface DragState {
  id: Lab2ItemId;
  fromSidebar: boolean;
  px: number;
  py: number;
}
interface Fx {
  kind: "drip-gv" | "drip-lugol" | "drip-alcohol" | "drip-fuchsin" | "drip-oil" | "wash" | "blot";
  x: number;
  y: number;
  key: number;
}

const DRIP_COLOR: Record<string, string> = {
  "apply-gv": "#6d28d9",
  "apply-lugol": "#92500f",
  "apply-alcohol": "#dbe6f0",
  "apply-fuchsin": "#d4146a",
  "apply-oil": "#e7b94e",
};

function nextHint(s: GramState): string {
  const sl = s.slide;
  if (!sl.onBridge) return "Tayyor surtmani (oyna) bo'yash ko'prigiga qo'ying";
  if (!sl.gv.applied) return sl.filterOn ? "Gensianviolet eritmasini filtr qog'oz ustidan tomizing" : "Surtma ustiga filtr qog'oz qo'ying";
  if (!sl.gv.removed) return "1-2 daqiqadan so'ng pinset bilan filtr qog'ozni oling (bo'yoq to'kiladi)";
  if (!sl.lugol.applied) return "Lyugol eritmasini tomizing (1-2 daqiqa)";
  if (!sl.alcohol.applied) return "Etil spirti bilan rangsizlantiring (binafsha rang yo'qolguncha)";
  if (!sl.alcohol.washed) return "Suv bilan yuving";
  if (!sl.fuchsin.applied) return "Fuksin bilan bo'yang (1-2 daqiqa)";
  if (!sl.fuchsin.washed) return "Suv bilan yuving";
  if (!sl.fuchsin.blotted) return "Filtr qog'oz bilan quriting";
  if (!sl.oilApplied) return "Immersion moyini tomizing";
  return "Oynani mikroskopga olib boring va Gram tegishliligini aniqlang";
}

export function Lab2Workbench() {
  const router = useRouter();
  const [gram, setGram] = useState<GramState>(() => freshGramState());
  const gramRef = useRef(gram);
  gramRef.current = gram;

  const tableRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Record<string, { x: number; y: number }>>({});
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;

  const [hoverTarget, setHoverTarget] = useState<Lab2ItemId | null>(null);
  const [fx, setFx] = useState<Fx | null>(null);
  const fxKey = useRef(0);
  const [toast, setToast] = useState<string | null>(null);
  const [trayStained, setTrayStained] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mode / exam
  const [mode, setMode] = useState<LabMode | null>(null);
  const modeRef = useRef<LabMode | null>(null);
  modeRef.current = mode;
  const [examPhase, setExamPhase] = useState<ExamPhase>("planning");
  const [actionLog, setActionLog] = useState<ExamAction[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  // Microscope / classification
  const [scopeOpen, setScopeOpen] = useState(false);
  const [reveal, setReveal] = useState(false);

  const isExam = mode === "exam";
  const examActive = isExam && examPhase === "execution";

  const flashAt = useCallback((kind: Fx["kind"], x: number, y: number) => {
    fxKey.current += 1;
    setFx({ kind, x, y, key: fxKey.current });
    window.setTimeout(() => setFx(null), 1000);
  }, []);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  const recordAction = useCallback((intent: string) => {
    setActionLog((log) => [...log, { intent, ts: Date.now() }]);
  }, []);

  /** Apply a staining action: mutate state, log it, show the matching effect. */
  function perform(intent: GramIntent) {
    setGram((g) => applyGramStep(g, intent));
    recordAction(intent);
    const sp = placedRef.current["slide"];
    const sx = sp?.x ?? 50;
    const sy = sp?.y ?? 50;
    if (intent === "apply-gv") flashAt("drip-gv", sx, sy);
    else if (intent === "apply-lugol") flashAt("drip-lugol", sx, sy);
    else if (intent === "apply-alcohol") flashAt("drip-alcohol", sx, sy);
    else if (intent === "apply-fuchsin") flashAt("drip-fuchsin", sx, sy);
    else if (intent === "apply-oil") flashAt("drip-oil", sx, sy);
    else if (intent === "blot") flashAt("blot", sx, sy);
    else if (intent === "wash") {
      flashAt("wash", sx, sy);
      if (placedRef.current["tray"]) setTrayStained(true);
    } else if (intent === "to-microscope") {
      setReveal(false);
      setScopeOpen(true);
    }
  }

  function hitPoint(d: DragState, clientX: number, clientY: number) {
    const def = LAB2_ITEM_BY_ID[d.id];
    return { hx: clientX + (def.tipX ?? 0) * GHOST_SCALE, hy: clientY + (def.tipY ?? 0) * GHOST_SCALE };
  }

  const targetAt = useCallback((px: number, py: number, exclude: Lab2ItemId): Lab2ItemId | null => {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    for (const [id, pos] of Object.entries(placedRef.current)) {
      const itemId = id as Lab2ItemId;
      if (itemId === exclude) continue;
      const def = LAB2_ITEM_BY_ID[itemId];
      if (!def.target) continue;
      const cx = (pos.x / 100) * rect.width;
      const cy = (pos.y / 100) * rect.height;
      if (px >= cx - def.w / 2 - DROP_PAD && px <= cx + def.w / 2 + DROP_PAD && py >= cy - def.h / 2 - DROP_PAD && py <= cy + def.h / 2 + DROP_PAD)
        return itemId;
    }
    return null;
  }, []);

  const startDrag = useCallback((id: Lab2ItemId, e: React.PointerEvent) => {
    const fromSidebar = !placedRef.current[id];
    setDrag({ id, fromSidebar, px: e.clientX, py: e.clientY });
  }, []);

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      setDrag((d) => (d ? { ...d, px: e.clientX, py: e.clientY } : d));
      const d = dragRef.current;
      const rect = tableRef.current?.getBoundingClientRect();
      if (!d || !rect) return;
      const { hx, hy } = hitPoint(d, e.clientX, e.clientY);
      const tg = targetAt(hx - rect.left, hy - rect.top, d.id);
      const valid = tg && intentFor(d.id, tg, gramRef.current);
      setHoverTarget(valid ? tg : null);
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
    const d = dragRef.current;
    const rect = tableRef.current?.getBoundingClientRect();
    if (!d || !rect) {
      endDrag();
      return;
    }
    const inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    // Dropped off-bench → return a placed tool to the tray.
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

    // Action drop (tool → target)?
    const { hx, hy } = hitPoint(d, e.clientX, e.clientY);
    const target = targetAt(hx - rect.left, hy - rect.top, d.id);
    if (target) {
      const intent = intentFor(d.id, target, gramRef.current);
      if (intent) {
        perform(intent);
        // Hand tools (bottles, wash, forceps, filter) snap back to the tray;
        // the slide is repositioned below.
        if (d.id !== "slide") {
          if (!d.fromSidebar) {
            // keep it where it is on the bench
            const x = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
            setPlaced((p) => ({ ...p, [d.id]: { x, y } }));
          }
          endDrag();
          return;
        }
      }
    }

    // Placement / snapping
    let xPct = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    let yPct = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));

    if (d.id === "slide") {
      const br = placedRef.current["bridge"];
      if (br) {
        xPct = br.x;
        yPct = br.y - 4;
        if (!gramRef.current.slide.onBridge) setGram((g) => ({ ...g, slide: { ...g.slide, onBridge: true } }));
      } else {
        showToast("Avval bo'yash ko'prigini stolga qo'ying");
        endDrag();
        return;
      }
    }
    setPlaced((p) => ({ ...p, [d.id]: { x: xPct, y: yPct } }));
    endDrag();
  }

  // Classification from the microscope.
  function classify(type: "positive" | "negative") {
    setGram((g) => ({ ...g, classification: type }));
    if (modeRef.current === "exam") {
      setScopeOpen(false);
      finishExam(type);
    } else {
      setReveal(true);
    }
  }

  function startExam() {
    setExamPhase("execution");
  }

  function finishExam(classification: "positive" | "negative" | null) {
    const cls = classification ?? gramRef.current.classification;
    setExamResult(scoreGramExam(actionLog, gramRef.current, cls));
    setExamPhase("result");
  }

  function restart() {
    setGram(freshGramState());
    setPlaced({});
    setActionLog([]);
    setExamResult(null);
    setTrayStained(false);
    setScopeOpen(false);
    setReveal(false);
    setExamPhase("planning");
    setMode(null);
  }

  const placedSet = new Set(Object.keys(placed)) as Set<Lab2ItemId>;
  const draggingDef = drag ? LAB2_ITEM_BY_ID[drag.id] : null;
  const hint = nextHint(gram);
  const slidePos = placed["slide"];

  const validTargets = new Set<Lab2ItemId>();
  if (drag) {
    LAB2_ITEMS.forEach((it) => {
      if (it.target && placedSet.has(it.id) && it.id !== drag.id && intentFor(drag.id, it.id, gram)) validTargets.add(it.id);
    });
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-slate-800 select-none" style={{ background: "#ececec" }}>
      <header className="z-30 flex items-center gap-3 border-b border-slate-300/70 bg-white/85 px-3 py-2 backdrop-blur">
        <button onClick={() => router.push("/")} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">←</button>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide text-slate-800">Gram usulida bo'yash</span>
          <span className="text-[11px] text-slate-500">Differensial bo'yash · Lab 2</span>
        </div>

        {!isExam && (
          <div className="mx-auto flex max-w-[44%] items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow">
            <span className="text-violet-300">➜</span>
            <span className="truncate">{hint}</span>
          </div>
        )}
        {examActive && (
          <div className="mx-auto flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 ring-1 ring-violet-200">
            <span>📝</span>
            <span>Imtihon — yordam yo'q. Bilganingizcha bajaring.</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {examActive && (
            <button onClick={() => finishExam(gram.classification)} className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-400">
              ✓ Yakunlash
            </button>
          )}
          <button onClick={restart} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">↻ Qayta</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && !(isExam && examPhase === "planning") && (
          <Lab2Sidebar state={gram} placed={placedSet} draggingId={drag?.id ?? null} trayStained={trayStained} onStartDrag={startDrag} showHints={!isExam} />
        )}

        <div ref={tableRef} className="relative flex-1 overflow-hidden" style={{ background: "linear-gradient(180deg,#ededed 0%,#e6e6e6 55%,#8f8f8f 55%,#9a9a9a 100%)" }}>
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="absolute left-2 top-1/2 z-40 grid h-14 w-7 -translate-y-1/2 place-items-center rounded-lg bg-white/90 text-xl font-bold text-slate-600 shadow-md transition hover:bg-white"
          >
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

          {/* Placed items */}
          {LAB2_ITEMS.filter((it) => placedSet.has(it.id)).map((it) => {
            const pos = placed[it.id];
            const isValid = validTargets.has(it.id);
            const isHover = hoverTarget === it.id;
            return (
              <div key={it.id} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)", opacity: drag?.id === it.id ? 0.35 : 1 }}>
                {(isValid || isHover) && (
                  <div
                    className="pointer-events-none absolute -inset-3 rounded-xl"
                    style={{
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
                  title={it.label}
                >
                  {it.render(gram, { trayStained })}
                </div>
              </div>
            );
          })}

          {/* Drip / wash / blot effects */}
          {fx && fx.kind.startsWith("drip") && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 8}%` }}>
              <Drop trigger={fx.key} color={DRIP_COLOR[fx.kind === "drip-gv" ? "apply-gv" : fx.kind === "drip-lugol" ? "apply-lugol" : fx.kind === "drip-alcohol" ? "apply-alcohol" : fx.kind === "drip-fuchsin" ? "apply-fuchsin" : "apply-oil"]} fallHeight={64} />
            </div>
          )}
          {fx?.kind === "wash" && (
            <div key={fx.key} className="pointer-events-none absolute z-30 overflow-hidden" style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: "translate(-50%,-30%)", width: 130, height: 180 }}>
              <motion.div
                initial={{ y: -90, opacity: 0.9 }}
                animate={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.95, ease: "easeIn" }}
                style={{ width: "100%", height: 60, background: "linear-gradient(180deg, rgba(150,200,225,0) 0%, rgba(150,200,225,0.9) 50%, rgba(150,200,225,0) 100%)" }}
              />
            </div>
          )}
          {fx?.kind === "blot" && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: "translate(-50%,-50%)", width: 104, height: 36 }}>
              <motion.div initial={{ scale: 1.08, opacity: 0 }} animate={{ scale: [1.08, 0.97, 1], opacity: [0, 0.6, 0] }} transition={{ duration: 0.9, ease: "easeOut" }} className="absolute inset-0 rounded" style={{ background: "rgba(255,255,255,0.55)", filter: "blur(2px)" }} />
            </div>
          )}

          {/* Drag ghost */}
          {drag && draggingDef && (
            <div className="pointer-events-none fixed z-50" style={{ left: drag.px, top: drag.py, transform: "translate(-50%,-50%) scale(1.06)", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
              {draggingDef.render(gram, { trayStained })}
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

      <MicroscopeModal
        open={scopeOpen}
        cellColor="violet"
        picked={gram.classification}
        reveal={reveal && !isExam}
        correct={SPECIMEN.gram}
        onClassify={classify}
        onClose={() => setScopeOpen(false)}
      />

      <AnimatePresence>{mode === null && <ModeSelect onPick={setMode} />}</AnimatePresence>

      <AnimatePresence>
        {isExam && examPhase === "result" && examResult && !scopeOpen && (
          <Lab2ResultModal result={examResult} onRestart={restart} onViewScope={() => setScopeOpen(true)} />
        )}
      </AnimatePresence>
    </div>
  );
}
