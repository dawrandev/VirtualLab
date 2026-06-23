"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useAuthStore, verifyCredentials } from "@/stores/authStore";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

type Status = "idle" | "verifying" | "granted";

/**
 * Institutional access gate shown until the student signs in. Mirrors the home
 * menu's light clinical theme (soft gradient backdrop, indigo→sky accents,
 * rounded card, framer-motion spring entrance) so it feels part of the app.
 */
export function LoginScreen() {
  const t = useTranslations("auth");
  const signIn = useAuthStore((s) => s.signIn);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(0);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status !== "idle") return;
    setError(false);
    setStatus("verifying");
    // Brief verifying beat so the state transition reads as a real check.
    window.setTimeout(() => {
      if (verifyCredentials(username, password)) {
        setStatus("granted");
        // Let the green "granted" state land before the gate swaps to content.
        window.setTimeout(signIn, 550);
      } else {
        setStatus("idle");
        setError(true);
        setShake((s) => s + 1);
      }
    }, 650);
  }

  const busy = status !== "idle";

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-5 text-slate-800">
      {/* Soft clinical backdrop — matches the home menu */}
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(160deg,#f7f9fc 0%,#eef2f8 45%,#e7edf6 100%)" }} />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 12%, rgba(99,102,241,0.10), transparent 38%), radial-gradient(circle at 85% 80%, rgba(14,165,233,0.10), transparent 40%)",
        }}
      />

      {/* Language switcher — students can pick their language before signing in */}
      <div className="absolute right-5 top-5 z-50">
        <LanguageSwitcher />
      </div>

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24 }}
        className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 p-7 shadow-xl shadow-slate-300/30 backdrop-blur sm:p-8"
      >
        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-indigo-500" />

        {/* Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-2xl shadow-md shadow-indigo-300/40">
            🧫
          </span>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> {t("eyebrow")}
          </span>
          <h1 className="text-[22px] font-extrabold tracking-tight text-slate-800">{t("title")}</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{t("subtitle")}</p>
        </div>

        {/* Fields (shake on bad credentials) */}
        <motion.div
          key={shake}
          animate={shake ? { x: [0, -9, 9, -6, 6, 0] } : undefined}
          transition={{ duration: 0.42 }}
          className="flex flex-col gap-3.5"
        >
          {/* Username */}
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">{t("username")}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="3.5" />
                  <path d="M5 20a7 7 0 0 1 14 0" />
                </svg>
              </span>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(false); }}
                placeholder={t("usernamePlaceholder")}
                disabled={busy}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
              />
            </div>
          </label>

          {/* Password */}
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-slate-600">{t("password")}</span>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </span>
              <input
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder={t("passwordPlaceholder")}
                disabled={busy}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-16 text-[14px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                {showPass ? t("hide") : t("show")}
              </button>
            </div>
          </label>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-rose-600"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4.5M12 16h.01" />
              </svg>
              {t("error")}
            </motion.p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={busy}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 py-2.5 text-[14px] font-semibold text-white shadow-md shadow-indigo-300/40 transition hover:brightness-105 active:scale-[0.99] disabled:cursor-default disabled:opacity-90"
          >
            {status === "verifying" && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {status === "granted" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
            {status === "idle" ? t("submit") : status === "verifying" ? t("verifying") : t("granted")}
          </button>
        </motion.div>

        {/* Footer */}
        <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          {t("footer")}
        </p>
      </motion.form>
    </main>
  );
}
