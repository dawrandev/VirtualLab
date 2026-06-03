"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Drop } from "@/labs/lab1/components2d/animations/Drop";
import { TestTubeRack } from "@/labs/lab1/components2d/items/TestTubeRack";
import { LoopStand } from "@/labs/lab1/components2d/items/LoopStand";
import { MicroscopeModal } from "@/labs/lab2/components2d/MicroscopeModal";
import { LAB3_ITEMS, LAB3_ITEM_BY_ID, intentFor, canIncubate, type Lab3ItemId } from "./items";
import { freshDrigalskiState, applyDrigalskiStep, type DrigalskiState, type DrigalskiIntent } from "../state";
import { SPECIMEN, INCUBATE_MS, DISPLAY_INCUBATE_HOURS, type LabMode, type ExamPhase } from "../exam/protocol";
import { scoreDrigalskiExam, type ExamAction, type ExamResult } from "../exam/scoring";
import { Lab3Sidebar } from "./Lab3Sidebar";
import { ModeSelect } from "./ModeSelect";
import { PlanningSidebar } from "./PlanningSidebar";
import { Lab3ResultModal } from "../components2d/Lab3ResultModal";

const DROP_PAD = 26;
const GHOST_SCALE = 1.06;
const SPATULA_COOL_MS = 3200;
const TICK = 70;
const RUB_K = 0.0016;
const REACTION_MS = 2200;

const TRAY_VIOLET: [string, string, string, string] = ["#6d28d9", "#4c1d95", "#5b21b6", "#7c3aed"];
const TRAY_PINK: [string, string, string, string] = ["#d4146a", "#9d174d", "#a8194f", "#be185d"];

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

/** How a (tool → target) action is performed. */
function actionKind(intent: DrigalskiIntent): Kind {
  if (intent === "load-pipette" || intent === "pick-colony") return "sample"; // timed, with a visual
  if (intent === "make-smear" || intent === "spread-1" || intent === "spread-2" || intent === "spread-3") return "rub";
  if (intent === "to-microscope") return "instant";
  return "contact"; // drip material, dip, flame, apply dyes, wash — fire on touch
}

const SAMPLE_DUR = 1500;
interface Fx {
  kind: "drip-mat" | "drip-gv" | "drip-lugol" | "drip-alcohol" | "drip-fuchsin" | "wash" | "dip";
  x: number;
  y: number;
  key: number;
}

const DRIP_COLOR: Record<string, string> = {
  "drip-mat": "#cfe0d6",
  "drip-gv": "#6d28d9",
  "drip-lugol": "#92500f",
  "drip-alcohol": "#dbe6f0",
  "drip-fuchsin": "#d4146a",
};

function fmtHours(h: number): string {
  return `${Math.max(0, Math.ceil(h))} soat`;
}

function nextHint(s: DrigalskiState): string {
  if (!s.dishes) return "Oziqa muhitli 3 ta Petri idishini stolga qo'ying";
  if (!s.pipetteLoaded && !s.d1.material) return "Pipetka bilan suspenziyadan oling";
  if (!s.d1.material) return "Pipetkadagi materialni 1-idishga tomizing";
  if (!s.spatulaDipped && !s.spatulaSterile) return "Shpatel uchini spirt bankasiga botiring";
  if (!s.spatulaSterile) return "Shpatelni olovda yoqing — spirt yonib sterillanadi (so'ng sovuting)";
  if (!s.d1.spread) return "Sovugan steril shpatel bilan 1-idishdagi agarga surting";
  if (!s.d2.spread) return "O'sha shpatel bilan (sterillamasdan) 2-idishga surting";
  if (!s.d3.spread) return "O'sha shpatel bilan 3-idishga surting";
  if (!s.incubated) return "3 ta idishni ham termostatga qo'ying (18-24 soat)";
  if (!s.colonyPicked) return "3-idishdagi alohida koloniyani halqa bilan oling";
  if (!s.smeared) return "Halqani oyna ustida yurgizib surtma tayyorlang";
  if (!s.gram.gv) return "Gram bo'yash: gensianviolet tomizing";
  if (!s.gram.lugol) return "Lyugol eritmasini tomizing";
  if (!s.gram.alcohol) return "Etil spirti bilan rangsizlantiring";
  if (!s.gram.fuchsin) return "Fuksin bilan bo'yang";
  return "Oynani mikroskopga olib boring va natijani aniqlang";
}

export function Lab3Workbench() {
  const router = useRouter();
  const [drig, setDrig] = useState<DrigalskiState>(() => freshDrigalskiState());
  const drigRef = useRef(drig);
  drigRef.current = drig;

  const tableRef = useRef<HTMLDivElement | null>(null);
  const [placed, setPlaced] = useState<Record<string, { x: number; y: number }>>({});
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
  // After a contact/sample action fires the tool stays in hand; lock the target
  // so it doesn't re-fire until the pointer leaves it.
  const lockTargetRef = useRef<Lab3ItemId | null>(null);

  const [fx, setFx] = useState<Fx | null>(null);
  const fxKey = useRef(0);
  const [toast, setToast] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [spatulaHot, setSpatulaHot] = useState(false);
  const [trayStained, setTrayStained] = useState(false);

  // Incubation + dye-reaction countdowns.
  const [inc, setInc] = useState<{ start: number } | null>(null);
  const [incProg, setIncProg] = useState(0);
  const [reaction, setReaction] = useState<{ start: number } | null>(null);
  const [reactionProg, setReactionProg] = useState(1);

  const [mode, setMode] = useState<LabMode | null>(null);
  const modeRef = useRef<LabMode | null>(null);
  modeRef.current = mode;
  const [examPhase, setExamPhase] = useState<ExamPhase>("planning");
  const [actionLog, setActionLog] = useState<ExamAction[]>([]);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  const [scopeOpen, setScopeOpen] = useState(false);
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
      }
    }, 90);
    return () => window.clearInterval(iv);
  }, [inc, recordAction]);

  // Dye reaction → colour deepens over a couple of seconds.
  useEffect(() => {
    if (!reaction) return;
    const iv = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - reaction.start) / REACTION_MS);
      setReactionProg(p);
      if (p >= 1) window.clearInterval(iv);
    }, 70);
    return () => window.clearInterval(iv);
  }, [reaction]);

  function perform(intent: DrigalskiIntent) {
    setDrig((g) => applyDrigalskiStep(g, intent));
    recordAction(intent);
    const at = (id: string) => {
      const p = placedRef.current[id];
      return { x: p?.x ?? 50, y: p?.y ?? 50 };
    };
    if (intent === "dip-spatula") flashAt("dip", at("alcohol-jar").x, at("alcohol-jar").y, 900);
    else if (intent === "sterilize-spatula") setSpatulaHot(true);
    else if (intent === "drop-material") flashAt("drip-mat", at("dish-1").x, at("dish-1").y);
    else if (intent === "apply-gv" || intent === "apply-lugol" || intent === "apply-alcohol" || intent === "apply-fuchsin") {
      const { x, y } = at("slide");
      flashAt(`drip-${intent === "apply-gv" ? "gv" : intent === "apply-lugol" ? "lugol" : intent === "apply-alcohol" ? "alcohol" : "fuchsin"}` as Fx["kind"], x, y, 1300);
      setReaction({ start: Date.now() });
      setReactionProg(0);
    } else if (intent === "wash") {
      const { x, y } = at("slide");
      flashAt("wash", x, y, 1100);
      if (placedRef.current["tray"]) setTrayStained(true);
    } else if (intent === "to-microscope") {
      setReveal(false);
      setScopeOpen(true);
    }
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

  /** Fired once a timed/rub action completes; the tool stays in hand. */
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
      const tg = targetAt(hx - rect.left, hy - rect.top, d.id);
      const intent = tg ? intentFor(d.id, tg, drigRef.current) : null;
      const validIncubate = tg === "incubator" && d.id.startsWith("dish-") && canIncubate(drigRef.current);
      setHoverTarget(intent || validIncubate ? tg : null);

      const h = holdRef.current;
      // Release the lock once the pointer leaves that target.
      if (lockTargetRef.current && tg !== lockTargetRef.current) lockTargetRef.current = null;

      if (!intent || !tg) {
        if (h && h.kind !== "rub") cancelHold(); // timed needs continuous contact
        return;
      }
      // Spreading plate 1 needs a sterile spreader.
      if (intent === "spread-1" && !drigRef.current.spatulaSterile) {
        if (h) cancelHold();
        return;
      }
      if (lockTargetRef.current === tg) return; // already fired, tool still in hand

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
      // rub — accumulate from movement
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
  }, [drag?.id]);

  function endDrag() {
    setDrag(null);
    setHoverTarget(null);
  }

  /** Snap a placed hand tool / apparatus to its home station, returning the % pos. */
  function snapPos(id: Lab3ItemId, rect: DOMRect, fallback: { x: number; y: number }): { x: number; y: number } {
    const p = placedRef.current;
    if (id === "suspension" && p["rack"]) return { x: p["rack"].x, y: p["rack"].y + (-59.5 / rect.height) * 100 };
    if (id === "loop" && p["loop-stand"]) return { x: p["loop-stand"].x, y: p["loop-stand"].y + (-55 / rect.height) * 100 };
    if (id === "spatula" && p["alcohol-jar"]) return { x: p["alcohol-jar"].x, y: p["alcohol-jar"].y - 22 };
    if (id === "slide" && p["bridge"]) return { x: p["bridge"].x, y: p["bridge"].y - 4 };
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
        showToast("Avval 3 ta idishga ham surting");
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
        // Instant actions fire on release; contact/sample/rub already fired
        // mid-drag. Either way the tool is laid back down (never vanishes).
        if (actionKind(intent) === "instant") perform(intent);
        const fx = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
        const fy = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
        const pos = snapPos(d.id, rect, { x: fx, y: fy });
        setPlaced((p) => ({ ...p, [d.id]: pos }));
        endDrag();
        return;
      }
    }

    // Plain placement (snap apparatus/tools to their stations).
    const fxp = Math.max(4, Math.min(96, ((e.clientX - rect.left) / rect.width) * 100));
    const fyp = Math.max(6, Math.min(94, ((e.clientY - rect.top) / rect.height) * 100));
    let pos = snapPos(d.id, rect, { x: fxp, y: fyp });
    if (d.id === "slide" && !placedRef.current["bridge"]) {
      showToast("Avval bo'yash ko'prigini stolga qo'ying");
      pos = { x: fxp, y: fyp };
    }
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

  function classify(type: "positive" | "negative") {
    setDrig((g) => ({ ...g, classification: type }));
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
    const cls = classification ?? drigRef.current.classification;
    setExamResult(scoreDrigalskiExam(actionLog, drigRef.current, cls));
    setExamPhase("result");
  }
  function restart() {
    setDrig(freshDrigalskiState());
    setPlaced({});
    setInIncubator(new Set());
    dishHome.current = {};
    setActionLog([]);
    setExamResult(null);
    setSpatulaHot(false);
    setTrayStained(false);
    setInc(null);
    setIncProg(0);
    setReaction(null);
    setReactionProg(1);
    cancelHold();
    lockTargetRef.current = null;
    setScopeOpen(false);
    setReveal(false);
    setExamPhase("planning");
    setMode(null);
  }

  const placedSet = new Set(Object.keys(placed).filter((k) => !inIncubator.has(k))) as Set<Lab3ItemId>;
  // Dishes inside the incubator are still "in use" — keep them out of the tray.
  const sidebarPlaced = new Set([...placedSet, ...inIncubator]) as Set<Lab3ItemId>;
  const draggingDef = drag ? LAB3_ITEM_BY_ID[drag.id] : null;
  const hint = nextHint(drig);
  const develop = reaction ? reactionProg : 1;
  const trayColors = drig.gram.fuchsin ? TRAY_PINK : TRAY_VIOLET;
  const sampling = hold?.kind === "sample";
  const renderOpts = {
    spatulaHot,
    incubatorRunning: inc != null,
    develop,
    trayStained,
    trayColors,
    suspensionPlugOff: sampling && hold?.intent === "load-pipette",
  };
  const slidePos = placed["slide"];
  const dish3Pos = placed["dish-3"];
  // Seated-on-station detection (drives the loop's vertical pose + the 3-layer
  // occlusion overlays so the loop/tube read as *inside* their stations).
  const loopOnStand = !!placed["loop"] && !!placed["loop-stand"] && Math.abs(placed["loop"].x - placed["loop-stand"].x) < 2;
  const tubeInRack = !!placed["suspension"] && !!placed["rack"] && Math.abs(placed["suspension"].x - placed["rack"].x) < 2;

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
          <span className="text-sm font-bold tracking-wide text-slate-800">Drigalski usulida ekish</span>
          <span className="text-[11px] text-slate-500">Shpatel bilan ekish · Lab 3</span>
        </div>

        {!isExam && (
          <div className="mx-auto flex max-w-[46%] items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white shadow">
            <span className="text-teal-300">➜</span>
            <span className="truncate">{hint}</span>
          </div>
        )}
        {examActive && (
          <div className="mx-auto flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
            <span>📝</span>
            <span>Imtihon — yordam yo'q. Bilganingizcha bajaring.</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          {examActive && (
            <button onClick={() => finishExam(drig.classification)} className="rounded-lg bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white shadow transition hover:bg-emerald-400">✓ Yakunlash</button>
          )}
          <button onClick={restart} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-200">↻ Qayta</button>
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
              <p className="rounded-2xl bg-white/80 px-5 py-3 text-sm font-medium text-slate-500 shadow">Avval o'ng paneldan ish tartibini tuzing →</p>
            </div>
          )}
          {placedSet.size === 0 && !drag && !isExam && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <p className="rounded-2xl bg-white/70 px-5 py-3 text-sm font-medium text-slate-500 shadow">Asboblarni chap paneldan ish stoliga sudrab oling</p>
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
                  {it.id === "loop" && loopOnStand ? (
                    <div style={{ transform: "rotate(90deg)", transition: "transform 0.12s ease" }}>{it.render(drig, renderOpts)}</div>
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
          {/* Front face of the loop stand — frosts the seated loop's handle. */}
          {loopOnStand && placed["loop-stand"] && (
            <div className="pointer-events-none absolute" style={{ left: `${placed["loop-stand"].x}%`, top: `${placed["loop-stand"].y}%`, transform: "translate(-50%,-50%)", zIndex: 5 }}>
              <LoopStand width={200} front />
            </div>
          )}

          {/* Smear marks building up as the loop rubs the slide */}
          {hold?.intent === "make-smear" && slidePos && (
            <div className="pointer-events-none absolute z-20" style={{ left: `${slidePos.x}%`, top: `${slidePos.y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="120" height="46" viewBox="0 0 120 46">
                <path d="M60 23 m -17 0 a 17 8.5 0 1 0 34 0 a 13 6.5 0 1 0 -26 0 a 9 4.5 0 1 0 18 0" stroke="#cdbb93" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeDasharray={170} strokeDashoffset={170 * (1 - hold.progress)} opacity="0.9" />
              </svg>
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

          {/* Colony pick: a touch ring pulses on the isolated colony in plate 3 */}
          {hold?.kind === "sample" && hold.intent === "pick-colony" && dish3Pos && (
            <div className="pointer-events-none absolute z-20" style={{ left: `${dish3Pos.x}%`, top: `${dish3Pos.y}%`, transform: "translate(-50%,-50%)" }}>
              <svg width="132" height="132" viewBox="0 0 132 132">
                <circle cx="44.9" cy="47.5" r={6 + hold.progress * 5} fill="none" stroke="#e0573f" strokeWidth="2" opacity={0.9 - hold.progress * 0.4} />
                <circle cx="44.9" cy="47.5" r="3.4" fill="#f8f8da" />
              </svg>
            </div>
          )}

          {/* Drips */}
          {fx && fx.kind.startsWith("drip") && (
            <div key={fx.key} className="pointer-events-none absolute z-30" style={{ left: `${fx.x}%`, top: `${fx.y - 8}%` }}>
              <Drop trigger={fx.key} color={DRIP_COLOR[fx.kind]} fallHeight={60} />
            </div>
          )}
          {/* Alcohol dip — expanding ripple rings on the jar's surface */}
          {fx?.kind === "dip" && (
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
                    stroke="#bfe0ee"
                    strokeWidth="1.6"
                  />
                ))}
                <motion.circle cx="45" cy="18" r="2.5" initial={{ y: -10, opacity: 0.9 }} animate={{ y: 0, opacity: 0 }} transition={{ duration: 0.35 }} fill="#cfe6f0" />
              </svg>
            </div>
          )}
          {/* Wash stream + coloured runoff toward the tray */}
          {fx?.kind === "wash" && (
            <div key={fx.key} className="pointer-events-none absolute z-30 overflow-hidden" style={{ left: `${fx.x}%`, top: `${fx.y}%`, transform: "translate(-50%,-30%)", width: 130, height: 190 }}>
              <motion.div initial={{ y: -90, opacity: 0.9 }} animate={{ y: 60, opacity: 0 }} transition={{ duration: 0.95, ease: "easeIn" }} style={{ width: "100%", height: 60, background: "linear-gradient(180deg, rgba(150,200,225,0) 0%, rgba(150,200,225,0.9) 50%, rgba(150,200,225,0) 100%)" }} />
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div key={i} initial={{ y: 4, opacity: 0 }} animate={{ y: 160, opacity: [0, 0.85, 0.85, 0] }} transition={{ duration: 0.85, delay: i * 0.07, ease: "easeIn" }} className="absolute rounded-full" style={{ left: `${20 + i * 16}%`, width: 6, height: 14, background: trayColors[0] }} />
              ))}
            </div>
          )}

          {/* Incubation countdown */}
          {inc && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-40 -translate-x-1/2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-900/90 px-4 py-2.5 text-white shadow-lg">
                <svg width="36" height="36" viewBox="0 0 36 36" className="shrink-0">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#ffffff22" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 15} strokeDashoffset={2 * Math.PI * 15 * (1 - incProg)} transform="rotate(-90 18 18)" style={{ transition: "stroke-dashoffset 0.1s linear" }} />
                  <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">37°</text>
                </svg>
                <div className="leading-tight">
                  <p className="text-[13px] font-semibold">Termostatda inkubatsiya…</p>
                  <p className="text-[11px] text-slate-300">Qoldi: {fmtHours(DISPLAY_INCUBATE_HOURS * (1 - incProg))} · real 18-24 soat</p>
                </div>
              </div>
            </div>
          )}

          {/* Drag ghost — the loop dips as it picks a colony / rubs a smear */}
          {drag && draggingDef && (
            <div className="pointer-events-none fixed z-50" style={{ left: drag.px, top: drag.py, transform: "translate(-50%,-50%) scale(1.06)", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.35))" }}>
              {drag.id === "loop" && hold ? (
                <div style={{ transform: `translateY(${hold.progress * 10}px)`, transition: "transform 0.1s ease" }}>{draggingDef.render(drig, renderOpts)}</div>
              ) : (
                draggingDef.render(drig, renderOpts)
              )}
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

      <MicroscopeModal open={scopeOpen} cellColor="violet" picked={drig.classification} reveal={reveal && !isExam} correct={SPECIMEN.gram} onClassify={classify} onClose={() => setScopeOpen(false)} />

      <AnimatePresence>{mode === null && <ModeSelect onPick={setMode} />}</AnimatePresence>

      <AnimatePresence>
        {isExam && examPhase === "result" && examResult && !scopeOpen && (
          <Lab3ResultModal result={examResult} onRestart={restart} onViewScope={() => setScopeOpen(true)} />
        )}
      </AnimatePresence>
    </div>
  );
}
