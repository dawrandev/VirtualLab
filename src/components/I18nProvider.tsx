"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

import uzMessages from "../../messages/uz.json";
import kaaMessages from "../../messages/kaa.json";
import ruMessages from "../../messages/ru.json";

const messagesByLocale = {
  uz: uzMessages,
  kaa: kaaMessages,
  ru: ruMessages,
} as const;

interface Props {
  children: ReactNode;
}

/**
 * Client-side i18n provider — reads selected locale from settingsStore
 * (persisted via Zustand `persist`) and reactively switches messages.
 * Bundles all 3 locales statically so locale switching is instant and
 * compatible with `output: 'export'`.
 */
export function I18nProvider({ children }: Props) {
  const locale = useSettingsStore((s) => s.locale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // While not hydrated we use UZ as the SSR default to avoid hydration mismatch.
  const activeLocale = hydrated ? locale : "uz";
  const messages = messagesByLocale[activeLocale] ?? messagesByLocale.uz;

  return (
    <NextIntlClientProvider locale={activeLocale} messages={messages} timeZone="Asia/Tashkent">
      {children}
    </NextIntlClientProvider>
  );
}
