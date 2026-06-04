"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Drop } from "@/labs/lab1/components2d/animations/Drop";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { AlcoholJar } from "@/labs/lab3/components2d/items/AlcoholJar";
import { LAB4_ITEMS, LAB4_ITEM_BY_ID, intentFor, type Lab4ItemId } from "./items";
import {
  freshDiskState,
  applyDiskStep,
  ANTIBIOTICS,
  allDisksPlaced,
  type DiskState,
  type DiskIntent,
} from "../state";
import { INCUBATE_MS, DISPLAY_INCUBATE_HOURS, type LabMode, type ExamPhase } from "../exam/protocol";
import { scoreDiskExam, type ExamAction, type ExamResult } from "../exam/scoring";
import { Lab4Sidebar } from "./Lab4Sidebar";
import { ModeSelect } from "./ModeSelect";
import { PlanningSidebar } from "./PlanningSidebar";
import { Lab4ResultModal } from "../components2d/Lab4ResultModal";
import { MeasureModal } from "../components2d/MeasureModal";

const DROP_PAD = 26;
const GHOST_SCALE = 1.06;
const SPATULA_COOL_MS = 3200;
const TICK = 70;
const RUB_K = 0.0016;

type Kind = "rub" | "contact" | "instant";
interface DragState {
  id: Lab4ItemId;
  fromSidebar: boolean;
  px: number;
  py: number;
}
interface Hold {
  kind: Kind;
  intent: DiskIntent;
  target: Lab4ItemId;
  progress: number;
}
interface Fx {
  kind: "drip-mat" | "dip";
  x: number;
  y: number;
  key: number;
}

function actionKind(intent: DiskIntent): Kind {
  if (intent === "spread-lawn") return "rub";
  return "contact";
}

function fmtHours(h: number): string {
  return `${Math.max(0, Math.ceil(h))} soat`;
}

function nextHint(s: DiskState, carrying: string | null): string {
  if (!s.dishPlaced) return "Oziqa muhitli Petri idishini stolga qo'ying";
  if (!s.spatulaDipped && !s.spatulaSterile) return "Shpatel uchini spirt bankasiga botiring";
  if (!s.spatulaSterile) return "Shpatelni olovda yoqing — spirt yonib sterillanadi (so'ng sovuting)";
  if (!s.spreaderCharged && !s.lawnSpread) return "Sovugan shpatel bilan E. coli kulturasidan oling";
  if (!s.lawnSpread) return "Kulturani Petri idishiga «gazon» (bir tekis) usulida surting";
  if (!allDisksPlaced(s)) return carrying ? "Pinsetdagi diskni agar yuzasiga qo'ying" : "Pinset bilan disklar to'plamidan antibiotik diskni oling";
  if (!s.incubated) return "Idishni termostatga qo'ying (37°C, 24 soat)";
  return "Tormozlanish zonalarini o'lchab, sezuvchanlikni aniqlang";
}

export function Lab4Workbench() {
  const router = useRouter();
  const [disk, setDisk] = useState<DiskState>(() => freshDiskState());
  const diskRef = useRef(disk);
  diskRef.current = disk;

  const tableRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Record<string, { x: number; y: number }>>({});
  const placedRef = useRef(placed);
  placedRef.current = placed;
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);
  dragRef.current = drag;
  const lastPtr = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [hoverTarget, setHoverTarget] = useState<Lab4ItemId | null>(null);
  const [hold, setHold] = useState<Hold | null>(null);
  const holdRef = useRef<Hold | null>(null);
  holdRef.current = hold;
  const lockTargetRef = useRef<Lab4ItemId | null>(null);

  const [fx, setFx] = useState<Fx | null>(null);
  const fxKey = useRef(0);
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [spatulaHot, setSpatulaHot] = useState(false);
  // Antibiotic disk currently held in the forceps.
  const [carrying, setCarrying] = useState<string | null>(null);
  const carryingRef = useRef<string | null>(null);
  carryingRef.current = carrying;

  const [inc, setInc] = useState<{ start: number } | null>(null);
  const [incProg, setIncProg] = useState(0);

  const [mode, setMode] = useState<LabMode | null>(null);
  const modeRef = useRef<LabMode | null>(null);
  modeRef.current = mode;
  const [examPhase, setExamPhase] = useState<ExamPhase>("planning");
  const [actionLog, setActionLog] = useState<ExamAction[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  const [measureOpen, setMeasureOpen] = useState(false);
  const [reveal, setReveal] = useState(false);

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

  useEffect(() => {
    if (!inc) return;
    const iv = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - inc.start) / INCUBATE_MS);
      setIncProg(p);
      if (p >= 1) {
        window.clearInterval(iv);
        setDisk((g) => applyDiskStep(g, "incubate"));
        recordAction("incubate");
        setInc(null);
      }
    }, 90);
    return () => window.clearInterval(iv);
  }, [inc, recordAction]);

  function perform(intent: DiskIntent) {
    const at = (id: string) => {
      const p = placedRef.current[id];
      return { x: p?.x ?? 50, y: p?.y ?? 50 };
    };
    if (intent === "pick-disk") {
      const next = ANTIBIOTICS.find((a) => !diskRef.current.disks[a.id] && carryingRef.current !== a.id);
      if (next) setCarrying(next.id);
      recordAction("pick-disk");
      return;
    }
    if (intent === "place-disk") {
      const held = carryingRef.current;
      if (!held) return;
      setDisk((g) => applyDiskStep(g, "place-disk", held));
      setCarrying(null);
      recordAction("place-disk");
      return;
    }
    setDisk((g) => applyDiskStep(g, intent));
    recordAction(intent);
    if (intent === "dip-spatula") flashAt("dip", at("alcohol-jar").x, at("alcohol-jar").y, 900);
    else if (intent === "sterilize-spatula") setSpatulaHot(true);
    else if (intent === "charge-spreader") flashAt("drip-mat", at("culture").x, at("culture").y, 800);
  }

  function startIncubation() {
    setIncProg(0);
    setInc({ start: Date.now() });
  }

  function hitPoint(d: DragState, clientX: number, clientY: number) {
    const def = LAB4_ITEM_BY_ID[d.id];
    return { hx: clientX + (def.tipX ?? 0) * GHOST_SCALE, hy: clientY + (def.tipY ?? 0) * GHOST_SCALE };
  }

  const targetAt = useCallback((px: number, py: number, exclude: Lab4ItemId): Lab4ItemId | null => {
    const rect = tableRef.current?.getBoundingClientRect();
    if (!rect) return null;
    for (const [id, pos] of Object.entries(placedRef.current)) {
      const itemId = id as Lab4ItemId;
      if (itemId === exclude) continue;
      const def = LAB4_ITEM_BY_ID[itemId];
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

  const startDrag = useCallback((id: Lab4ItemId, e: React.PointerEvent) => {
    const fromSidebar = !placedRef.current[id];
    lastPtr.current = { x: e.clientX, y: e.clientY };
    setDrag({ id, fromSidebar, px: e.clientX, py: e.clientY });
  }, []);

  function cancelHold() {
    holdRef.current = null;
    setHold(null);
  }
  function completeAction(intent: DiskIntent, target: Lab4ItemId) {
    perform(intent);
    cancelHold();
    lockTargetRef.current = target;
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
      const intent = tg ? intentFor(d.id, tg, diskRef.current, carryingRef.current) : null;
      const validIncubate = tg === "incubator" && d.id === "dish" && diskRef.current.lawnSpread && allDisksPlaced(diskRef.current) && !diskRef.current.incubated;
      setHoverTarget(intent || validIncubate ? tg : null);

      const h = holdRef.current;
      if (lockTargetRef.current && tg !== lockTargetRef.current) lockTargetRef.current = null;

      if (!intent || !tg) {
        if (h) cancelHold();
        return;
      }
      // Charging / spreading needs a sterile, cooled spreader.
      if ((intent === "charge-spreader" || intent === "spread-lawn") && spatulaHot) {
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
      // rub (gazon)
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
  }, [drag?.id, spatulaHot]);

  function endDrag() {
    setDrag(null);
    setHoverTarget(null);
  }

  function snapPos(id: Lab4ItemId, rect: DOMRect, fallback: { x: number; y: number }): { x: number; y: number } {
    const p = placedRef.current;
    if (id === "culture" && p["rack"]) return { x: p["rack"].x, y: p["rack"].y + (-59.5 / rect.height) * 100 };
    if (id === "spatula" && p["alcohol-jar"]) return { x: p["alcohol-jar"].x, y: p["alcohol-jar"].y + (-30 / rect.height) * 100 };
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

    // Put the plate into the incubator → start incubation.
    if (target === "incubator" && d.id === "dish") {
      if (diskRef.current.lawnSpread && allDisksPlaced(diskRef.current) && !diskRef.current.incubated) startIncubation();
      else showToast("Avval gazon ekib, barcha disklarni qo'ying");
      endDrag();
      return;
    }

    if (target) {
      const intent = intentFor(d.id, target, diskRef.current, carryingRef.current);
      if (intent) {
        // contact/rub already fired mid-drag; lay the tool down (snap).
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
    const pos = snapPos(d.id, rect, { x: fxp, y: fyp });
    setPlaced((p) => ({ ...p, [d.id]: pos }));
    if (d.id === "dish" && !diskRef.current.dishPlaced) setDisk((g) => ({ ...g, dishPlaced: true }));
    endDrag();
  }

  function classify(diskId: string, sens: "high" | "low") {
    setDisk((g) => ({ ...g, classified: { ...g.classified, [diskId]: sens } }));
    if (modeRef.current === "learn") setReveal(true);
  }
  function startExam() {
    setExamPhase("execution");
  }
  function finishExam() {
    setMeasureOpen(false);
    setExamResult(scoreDiskExam(actionLog, diskRef.current));
    setExamPhase("result");
  }
  function restart() {
    setDisk(freshDiskState());
    setPlaced({});
    setActionLog([]);
    setExamResult(null);
    setSpatulaHot(false);
    setCarrying(null);
    setInc(null);
    setIncProg(0);
    cancelHold();
    lockTargetRef.current = null;
    setMeasureOpen(false);
    setReveal(false);
    setExamPhase("planning");
    setMode(null);
  }

  const placedSet = new Set(Object.keys(placed)) as Set<Lab4ItemId>;
  const draggingDef = drag ? LAB4_ITEM_BY_ID[drag.id] : null;
  const hint = nextHint(disk, carrying);
  const renderOpts = { spatulaHot, incubatorRunning: inc != null, carrying };
  const dishPos = placed["dish"];
  const spatulaInJar = !!placed["spatula"] && !!placed["alcohol-jar"] && Math.abs(placed["spatula"].x - placed["alcohol-jar"].x) < 3;
  const tubeInRack = !!placed["culture"] && !!placed["rack"] && Math.abs(placed["culture"].x - placed["rack"].x) < 2;

  const validTargets = new Set<Lab4ItemId>();
  if (drag) {
    LAB4_ITEMS.forEach((it) => {
      if (!it.target || !placedSet.has(it.id) || it.id === drag.id) return;
      if (intentFor(drag.id, it.id, disk, carrying)) validTargets.add(it.id);
      if (it.id === "incubator" && drag.id === "dish" && disk.lawnSpread && allDisksPlaced(disk) && !disk.incubated) validTargets.add(it.id);
    });
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-slate-800 select-none" style={{ background: "#ececec" }}>
      <header className="z-30 flex items-center gap-3 border-b border-slate-300/70 bg-white/85 px-3 py-2 backdrop-blur">
        <button onClick={() => router.push("/")} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">←</button>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-wide text-slate-800">Antibiotiklarga sezuvchanlik</span>
          <span className="text-[11px] text-slate-500">Qog'oz disk usuli · Lab 4</span>
        </div>

        {!isExam && (
          <div className="mx-auto flex max-w-[46%] items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow">
            <span className="text-sky-300">➜</span>
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
          {examActive && disk.incubated && (
            <button onClick={() => { setReveal(false); setMeasureOpen(true); }} className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-sky-500">🔍 Zonalarni o'lchash</button>
          )}
          <button onClick={restart} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">↻ Qayta</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && !(isExam && examPhase === "planning") && (
          <Lab4Sidebar state={disk} placed={placedSet} draggingId={drag?.id ?? null} carrying={carrying} onStartDrag={startDrag} showHints={!isExam} />
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

          {LAB4_ITEMS.filter((it) => placedSet.has(it.id)).map((it) => {
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
                      border: `2px dashed ${isHover ? "#0284c7" : "#7dd3fc"}`,
                      boxShadow: isHover ? "0 0 18px rgba(2,132,199,0.45)" : "none",
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
                  {it.id === "spatula" && spatulaInJar ? (
                    <div style={{ transform: "rotate(90deg)", transition: "transform 0.15s ease" }}>{it.render(disk, renderOpts)}</div>
                  ) : (
                    it.render(disk, renderOpts)
                  )}
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
          {/* Front of the alcohol jar over the dipped spreader */}
          {spatulaInJar && placed["alcohol-jar"] && (
            <div className="pointer-events-none absolute" style={{ left: `${placed["alcohol-jar"].x}%`, top: `${placed["alcohol-jar"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
              <AlcoholJar width={110} front />
            </div>
          )}

          {/* Gazon spread visual building on the plate during the rub */}
          {hold?.intent === "spread-lawn" && dishPos && (
            <div className="pointer-events-none absolute z-20" style={{ left: `${dishPos.x}%`, top: `${dishPos.y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="84" fill="#eceadb" opacity={0.55 * hold.progress} />
                {[0, 1, 2, 3].map((i) => (
                  <path key={i} d={`M 30 ${60 + i * 22} Q 100 ${48 + i * 22} 170 ${60 + i * 22}`} stroke="#e7e4cf" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray={150} strokeDashoffset={150 * (1 - Math.max(0, Math.min(1, hold.progress * 1.6 - i * 0.18)))} opacity="0.7" />
                ))}
              </svg>
            </div>
          )}

          {/* Effects */}
          {fx?.kind === "drip-mat" && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 8}%` }}>
              <Drop trigger={fx.key} color="#cfe0d6" fallHeight={56} />
            </div>
          )}
          {fx?.kind === "dip" && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 18}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="90" height="40" viewBox="0 0 90 40">
                {[0, 1, 2].map((i) => (
                  <motion.ellipse key={i} cx="45" cy="20" initial={{ rx: 5, ry: 2, opacity: 0.7 }} animate={{ rx: 26, ry: 9, opacity: 0 }} transition={{ duration: 0.8, delay: i * 0.18, ease: "easeOut" }} fill="none" stroke="#bfe0ee" strokeWidth="1.6" />
                ))}
              </svg>
            </div>
          )}

          {/* Incubation countdown */}
          {inc && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-900/90 px-4 py-2.5 text-white shadow-lg">
                <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#ffffff22" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 * (1 - incProg)} transform="rotate(-90 18 18)" style={{ transition: "stroke-dashoffset 0.1s linear" }} />
                  <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">37°</text>
                </svg>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold">Termostatda inkubatsiya…</p>
                  <p className="text-[11px] text-slate-300">Qoldi: {fmtHours(DISPLAY_INCUBATE_HOURS * (1 - incProg))} · real 24 soat</p>
                </div>
              </div>
            </div>
          )}

          {/* Measure button (learn mode) after incubation */}
          {!isExam && disk.incubated && (
            <button onClick={() => { setReveal(false); setMeasureOpen(true); }} className="absolute bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-500">
              🔍 Tormozlanish zonalarini o'lchash
            </button>
          )}

          {/* Drag ghost — forceps carrying a disk shows a small disk at its tips */}
          {drag && draggingDef && (
            <div className="pointer-events-none fixed z-50" style={{ left: drag.px, top: drag.py, transform: "translate(-50%,-50%) scale(1.06)", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
              <div className="relative">
                {draggingDef.render(disk, renderOpts)}
                {drag.id === "forceps" && carrying && (
                  <svg width="22" height="22" viewBox="0 0 22 22" className="absolute" style={{ left: "50%", bottom: -6, transform: "translateX(-50%)" }}>
                    <circle cx="11" cy="11" r="9" fill="#fbfbf6" stroke="#cfcabd" strokeWidth="1" />
                    <text x="11" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#5b6770">{ANTIBIOTICS.find((a) => a.id === carrying)?.code}</text>
                  </svg>
                )}
              </div>
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

      <MeasureModal
        open={measureOpen}
        state={disk}
        reveal={reveal && !isExam}
        isExam={isExam}
        onClassify={classify}
        onClose={() => setMeasureOpen(false)}
        onFinish={() => {
          if (isExam) finishExam();
          else setMeasureOpen(false);
        }}
      />

      <AnimatePresence>{mode === null && <ModeSelect onPick={setMode} />}</AnimatePresence>

      <AnimatePresence>
        {isExam && examPhase === "result" && examResult && (
          <Lab4ResultModal result={examResult} onRestart={restart} />
        )}
      </AnimatePresence>
    </div>
  );
}
