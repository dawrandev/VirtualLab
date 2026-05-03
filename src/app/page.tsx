"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page redirects to /lab/1.
 * Client-side redirect for static export compatibility.
 */
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/lab/1");
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-300">
      <p>Yuklanmoqda…</p>
    </div>
  );
}
