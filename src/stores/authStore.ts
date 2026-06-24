import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Single shared institutional credential for the virtual lab. This is a
 * client-side classroom gate (the app is a static export with no backend),
 * so the goal is to keep the lab behind one shared key handed out to a
 * cohort — not to provide real per-user security.
 */
const VALID_USERNAME = "mikrobiologiya";
const VALID_PASSWORD = "micro-2026!";

/** Pure credential check — used by the login screen before flipping state. */
export function verifyCredentials(username: string, password: string): boolean {
  return username.trim().toLowerCase() === VALID_USERNAME && password === VALID_PASSWORD;
}

/** How long a sign-in stays valid before the student must log in again (1.5 h). */
export const SESSION_MS = 90 * 60 * 1000;

interface AuthState {
  authed: boolean;
  /** Epoch ms when the current session expires (null when signed out). */
  expiresAt: number | null;
  /** Mark the session as authenticated (call only after verifyCredentials). */
  signIn: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authed: false,
      expiresAt: null,
      signIn: () => set({ authed: true, expiresAt: Date.now() + SESSION_MS }),
      logout: () => set({ authed: false, expiresAt: null }),
    }),
    {
      name: "vcl_auth_v1",
      version: 2,
      // v1 had no expiry — drop any old session so everyone starts a fresh,
      // time-boxed one.
      migrate: () => ({ authed: false, expiresAt: null }),
    },
  ),
);
