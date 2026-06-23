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

interface AuthState {
  authed: boolean;
  /** Mark the session as authenticated (call only after verifyCredentials). */
  signIn: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authed: false,
      signIn: () => set({ authed: true }),
      logout: () => set({ authed: false }),
    }),
    {
      name: "vcl_auth_v1",
      version: 1,
    },
  ),
);
