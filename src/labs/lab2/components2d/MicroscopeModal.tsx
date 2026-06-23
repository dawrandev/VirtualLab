"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  /** "violet" = Gram-positive cells retained the stain; "pink" = decolorized. */
  cellColor: "violet" | "pink";
  /** The student's current pick (null until they choose). */
  picked: "positive" | "negative" | null;
  /** In learn mode the correct answer + feedback is revealed after picking. */
  reveal: boolean;
  correct: "positive" | "negative";
  /** How many grape-like cocci clusters to draw (default = all 9). */
  cocciCount?: number;
  /** How many red counterstained rods (bacilli) to scatter (default 0).
   *  A real Gram smear shows both: violet cocci + fuchsin-red rods. */
  redRods?: number;
  /** Learn-mode REFERENCE view: shows BOTH Gram results (positive + negative)
   *  side by side, static, labelled — the student does not classify, they study
   *  what each type looks like. Exam mode keeps the single-field + classify view. */
  reference?: boolean;
  onClassify: (type: "positive" | "negative") => void;
  onClose: () => void;
}

interface P {
  id: number;
  left: number;
  top: number;
  size: number;
}

const CLUSTER_CENTERS = [
  [32, 34], [60, 26], [45, 54], [70, 62], [24, 66], [54, 76], [78, 42], [38, 74], [66, 40],
];

function clusters(n: number): P[] {
  // Deterministic grape-like cocci clusters (no Math.random for stability).
  const pts: P[] = [];
  let id = 0;
  for (const [cxp, cyp] of CLUSTER_CENTERS.slice(0, n)) {
    const offs = [[-3.6, -2.8], [-0.6, -3.6], [2.4, -2.6], [-3, 0.4], [0, 0], [3, 1], [-1.2, 3], [2, 3.2], [-3.4, 3.4]];
    for (const [dx, dy] of offs) {
      pts.push({ id: id++, left: cxp + dx, top: cyp + dy, size: 13 });
    }
  }
  return pts;
}

interface Rod {
  id: number;
  left: number;
  top: number;
  len: number;
  angle: number;
}

/** Deterministic scatter of red counterstained rods (Gram-negative bacilli). */
function rods(n: number): Rod[] {
  const seeds = [
    [18, 30], [40, 18], [62, 28], [79, 44], [30, 52], [52, 44], [70, 64], [23, 73], [46, 70], [66, 35],
    [34, 38], [58, 60], [82, 27], [15, 50], [50, 30], [73, 52], [36, 63], [60, 73], [26, 41], [80, 61],
    [44, 82], [64, 83], [20, 82], [84, 40], [41, 52], [56, 20], [74, 73], [28, 27], [48, 60], [69, 47],
  ];
  return seeds.slice(0, n).map(([l, t], i) => ({ id: i, left: l, top: t, len: 13 + (i % 4) * 2.4, angle: (i * 47) % 180 }));
}

// `closest-side` makes the gradient reach 100% exactly at the circle's edge, so
// the rim — and everything in the square's corners beyond it — is dark. That way
// no light rectangle can show around the circle even if a backdrop-filter ancestor
// causes the rounded clip to leak its square bounding box, and it doubles as a
// natural microscope vignette.
const VIOLET_FIELD = "radial-gradient(circle closest-side, #f3eefb 0%, #e6d9f5 56%, #b69ad5 82%, #4a3470 94%, #0b0712 100%)";
const PINK_FIELD = "radial-gradient(circle closest-side, #fdf4f8 0%, #f7e6ee 56%, #d4abc1 82%, #7e4660 94%, #0d070a 100%)";

/** One static microscope eyepiece field: vignetted circle of stained cocci
 *  (violet) and/or counterstained rods (red). Cells are STILL — a fixed smear,
 *  no jiggle. */
function Eyepiece({
  cellColor,
  cocciCount,
  redRods,
  size,
  fieldLabel,
}: {
  cellColor: "violet" | "pink";
  cocciCount: number;
  redRods: number;
  size: string;
  fieldLabel: string;
}) {
  const cells = clusters(cocciCount);
  const rodCells = rods(redRods);
  const fill = cellColor === "violet" ? "#3b0a6b" : "#a8194f";
  const bg = cellColor === "violet" ? VIOLET_FIELD : PINK_FIELD;
  return (
    <div className="relative" style={{ height: size, width: size }}>
      <div
        className="absolute inset-0 overflow-hidden rounded-full ring-4 ring-slate-800 shadow-[0_0_120px_rgba(0,0,0,0.8)]"
        style={{ background: bg }}
      >
        {/* Red counterstained rods (Gram-negative bacilli) — drawn first so the
            violet cocci clusters read on top of them. */}
        {rodCells.map((r) => (
          <div
            key={`r-${r.id}`}
            style={{
              position: "absolute",
              left: `${r.left}%`,
              top: `${r.top}%`,
              width: r.len,
              height: 4.6,
              borderRadius: 3,
              transform: `rotate(${r.angle}deg)`,
              background: "#c01f56",
              boxShadow: "0 0 3px rgba(178,24,80,0.6)",
              opacity: 0.88,
            }}
          />
        ))}
        {cells.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: fill,
              boxShadow: `0 0 4px ${fill}, inset 0 0 2px rgba(255,255,255,0.4)`,
              opacity: 0.92,
            }}
          />
        ))}
        {/* Centred at the bottom so the circular mask never clips it. */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">{fieldLabel}</div>
      </div>
    </div>
  );
}

/** Microscope eyepiece view for the Gram result. In LEARN mode it is a static
 *  reference showing BOTH Gram types (violet cocci vs. fuchsin-red rods) so the
 *  student learns to recognise each; in EXAM mode it shows the single smear field
 *  and the student classifies it. */
export function MicroscopeModal({ open, cellColor, picked, reveal, correct, cocciCount = 9, redRods = 0, reference = false, onClassify, onClose }: Props) {
  const t = useTranslations();
  const isRight = picked === correct;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md"
        >
          <button onClick={onClose} className="absolute right-6 top-6 z-50 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="close">
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" /></svg>
          </button>

          {reference ? (
            /* LEARN — study both results side by side. No classification. */
            <div className="flex max-h-[92vh] flex-col items-center gap-5 overflow-y-auto py-6">
              <p className="px-4 text-center text-base font-bold text-white">{t("gram.referenceTitle")}</p>
              <div className="flex flex-wrap items-start justify-center gap-6">
                <div className="flex w-[min(44vw,400px)] flex-col items-center gap-2">
                  <Eyepiece cellColor="violet" cocciCount={9} redRods={0} size="min(44vw,400px)" fieldLabel={t("gram.field")} />
                  <p className="text-[15px] font-bold" style={{ color: "#c4b5fd" }}>{t("gram.positive")}</p>
                  <p className="max-w-[380px] text-center text-[13px] leading-snug text-slate-200">{t("gram.revealPositive")}</p>
                </div>
                <div className="flex w-[min(44vw,400px)] flex-col items-center gap-2">
                  <Eyepiece cellColor="pink" cocciCount={0} redRods={24} size="min(44vw,400px)" fieldLabel={t("gram.field")} />
                  <p className="text-[15px] font-bold" style={{ color: "#f9a8d4" }}>{t("gram.negative")}</p>
                  <p className="max-w-[380px] text-center text-[13px] leading-snug text-slate-200">{t("gram.revealNegative")}</p>
                </div>
              </div>
            </div>
          ) : (
            /* EXAM — one field; the student classifies it. */
            <div className="flex flex-col items-center gap-5">
              <Eyepiece cellColor={cellColor} cocciCount={cocciCount} redRods={redRods} size="min(70vw,440px)" fieldLabel={t("gram.field")} />

              <div className="w-[min(90vw,460px)] rounded-2xl bg-white/95 p-4 text-center shadow-2xl">
                <p className="mb-3 text-sm font-semibold text-slate-700">{t("gram.question")}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onClassify("positive")}
                    className="flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition"
                    style={{
                      borderColor: picked === "positive" ? "#6d28d9" : "#e2e8f0",
                      background: picked === "positive" ? "#f5f3ff" : "#fff",
                      color: "#5b21b6",
                    }}
                  >
                    {t("gram.positive")}<br /><span className="text-[11px] font-normal text-slate-500">{t("gram.positiveSub")}</span>
                  </button>
                  <button
                    onClick={() => onClassify("negative")}
                    className="flex-1 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition"
                    style={{
                      borderColor: picked === "negative" ? "#be185d" : "#e2e8f0",
                      background: picked === "negative" ? "#fdf2f8" : "#fff",
                      color: "#9d174d",
                    }}
                  >
                    {t("gram.negative")}<br /><span className="text-[11px] font-normal text-slate-500">{t("gram.negativeSub")}</span>
                  </button>
                </div>

                {reveal && picked && (
                  <div
                    className="mt-3 rounded-lg px-3 py-2 text-[13px] font-medium"
                    style={{ background: isRight ? "#ecfdf5" : "#fef2f2", color: isRight ? "#059669" : "#dc2626" }}
                  >
                    {isRight ? t("gram.right") : t("gram.wrong")}
                    {correct === "positive" ? t("gram.revealPositive") : t("gram.revealNegative")}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
