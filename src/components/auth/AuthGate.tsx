"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { LoginScreen } from "./LoginScreen";

/**
 * Wraps the whole app. The auth flag lives in localStorage (Zustand `persist`),
 * which is only readable after mount — so, exactly like I18nProvider, we render
 * a neutral splash until hydrated to keep the static-export markup matching the
 * client's first render. Once hydrated: unauthenticated → login screen,
 * authenticated → the requested page.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const authed = useAuthStore((s) => s.authed);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const logout = useAuthStore((s) => s.logout);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Expire the session 1.5 h after sign-in — even if the tab is left open: when
  // it lapses the timer signs the student out (back to the login screen).
  useEffect(() => {
    if (!hydrated || !authed) return;
    if (expiresAt == null || Date.now() >= expiresAt) {
      logout();
      return;
    }
    const t = window.setTimeout(logout, expiresAt - Date.now());
    return () => window.clearTimeout(t);
  }, [hydrated, authed, expiresAt, logout]);

  if (!hydrated) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center"
        style={{ background: "linear-gradient(160deg,#f7f9fc 0%,#eef2f8 45%,#e7edf6 100%)" }}
      >
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-slate-300 border-t-indigo-500" />
      </div>
    );
  }

  const valid = authed && expiresAt != null && Date.now() < expiresAt;
  if (!valid) return <LoginScreen />;

  return <>{children}</>;
}
