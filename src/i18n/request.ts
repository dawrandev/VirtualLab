import { getRequestConfig } from "next-intl/server";

export const SUPPORTED_LOCALES = ["uz", "kaa", "ru"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "uz";

/**
 * next-intl request config for App Router.
 * Locale is read from a cookie set by the client locale switcher; falls back to default.
 */
export default getRequestConfig(async () => {
  // For static export with client-side locale, we serve UZ at build-time and
  // swap messages at runtime via NextIntlClientProvider.
  const locale: Locale = DEFAULT_LOCALE;
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return {
    locale,
    messages,
  };
});
