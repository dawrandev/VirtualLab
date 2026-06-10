"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { LABS, type LabEntry } from "@/labs/catalog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/**
 * Home menu — the project entry screen. Shows the 6 microbiology laboratories
 * as cards; available labs navigate into the workbench, planned ones show a
 * "coming soon" badge. Light, clinical theme to match the lab UI.
 */
export default function Home() {
  const router = useRouter();
  const t = useTranslations();
  const done = LABS.filter((l) => l.available).length;

  return (
    <main className="relative min-h-screen w-full overflow-hidden text-slate-800">
      {/* Soft clinical backdrop */}
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(160deg,#f7f9fc 0%,#eef2f8 45%,#e7edf6 100%)" }} />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 12%, rgba(99,102,241,0.10), transparent 38%), radial-gradient(circle at 85% 80%, rgba(14,165,233,0.10), transparent 40%)",
        }}
      />

      {/* Language switcher — fixed top-right */}
      <div className="absolute right-5 top-5 z-50">
        <LanguageSwitcher />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        {/* Header */}
        <header className="mb-9 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-2.5 rounded-full bg-white/70 px-4 py-1.5 shadow-sm ring-1 ring-slate-200/70 backdrop-blur">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-[13px]">🧫</span>
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("home.badge")}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">{t("home.title")}</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500">{t("home.tagline")}</p>
        </header>

        {/* Lab grid — centred flex-wrap so the 5th lab's row stays balanced
            (3 on top, 2 centred below) instead of leaving an empty cell. */}
        <section className="flex flex-1 flex-wrap content-start justify-center gap-5">
          {LABS.map((lab, i) => (
            <LabCard key={lab.id} lab={lab} index={i} onOpen={() => router.push(lab.href)} />
          ))}
        </section>

        <footer className="mt-10 text-center text-[12px] text-slate-400">{t("home.footer", { done })}</footer>
      </div>
    </main>
  );
}

function LabCard({ lab, index, onOpen }: { lab: LabEntry; index: number; onOpen: () => void }) {
  const enabled = lab.available;
  const t = useTranslations();
  return (
    <motion.button
      type="button"
      disabled={!enabled}
      onClick={enabled ? onOpen : undefined}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 260, damping: 26 }}
      whileHover={enabled ? { y: -5 } : undefined}
      whileTap={enabled ? { scale: 0.98 } : undefined}
      className="group relative flex w-full flex-col items-start gap-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-left shadow-sm backdrop-blur transition disabled:cursor-not-allowed sm:w-[336px] lg:w-[350px]"
      style={{ boxShadow: enabled ? "0 1px 2px rgba(15,23,42,0.06)" : "none", opacity: enabled ? 1 : 0.62 }}
    >
      {/* Accent wash on hover */}
      {enabled && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: `linear-gradient(160deg, ${lab.accent.soft}, transparent 70%)` }}
        />
      )}

      <div className="relative flex w-full items-start justify-between">
        {/* Icon chip */}
        <span
          className="grid h-14 w-14 place-items-center rounded-2xl text-white shadow-md"
          style={{ background: `linear-gradient(145deg, ${lab.accent.from}, ${lab.accent.to})` }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d={lab.paths} />
          </svg>
        </span>

        {/* Status badge */}
        {enabled ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("home.ready")}
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-400 ring-1 ring-slate-200">
            {t("home.comingSoon")}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: lab.accent.to }}>
            Lab {lab.id}
          </span>
          <span className="text-[11px] text-slate-400">· {t(`labs.${lab.id}.subtitle`)}</span>
        </div>
        <h2 className="text-[16px] font-bold leading-snug text-slate-800">{t(`labs.${lab.id}.title`)}</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{t(`labs.${lab.id}.desc`)}</p>
      </div>

      {/* Footer CTA */}
      <div className="relative mt-auto flex w-full items-center pt-1">
        {enabled ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold transition-transform group-hover:translate-x-0.5" style={{ color: lab.accent.to }}>
            {t("home.enter")}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        ) : (
          <span className="text-[13px] font-medium text-slate-400">{t("home.unavailable")}</span>
        )}
      </div>
    </motion.button>
  );
}
