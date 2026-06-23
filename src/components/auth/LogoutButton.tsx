"use client";

import { useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";

/**
 * Compact sign-out button styled to sit next to the LanguageSwitcher in the
 * home header. Reverts to the login screen by clearing the persisted auth flag.
 */
export function LogoutButton({ className = "" }: { className?: string }) {
  const t = useTranslations("auth");
  const logout = useAuthStore((s) => s.logout);

  return (
    <button
      type="button"
      onClick={logout}
      aria-label={t("signOut")}
      className={`flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-rose-600 ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="M16 17l5-5-5-5M21 12H9" />
      </svg>
      <span className="hidden sm:inline">{t("signOut")}</span>
    </button>
  );
}
