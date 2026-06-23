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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

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

  if (!authed) return <LoginScreen />;

  return <>{children}</>;
}
