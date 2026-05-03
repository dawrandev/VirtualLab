"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLabStore } from "@/stores/labStore";

export function ErrorToast() {
  const t = useTranslations();
  const errors = useLabStore((s) => s.state.errors);
  const clearErrors = useLabStore((s) => s.clearErrors);

  useEffect(() => {
    if (errors.length === 0) return;
    const timer = setTimeout(clearErrors, 4000);
    return () => clearTimeout(timer);
  }, [errors, clearErrors]);

  if (errors.length === 0) return null;
  const last = errors[errors.length - 1];

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-30 -translate-x-1/2 transform">
      <div className="rounded-xl bg-rose-600/90 px-4 py-3 shadow-2xl ring-1 ring-rose-400/40 backdrop-blur-md">
        <p className="text-sm font-medium text-white">{t(last as never)}</p>
      </div>
    </div>
  );
}
