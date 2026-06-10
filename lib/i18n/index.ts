import bn from "./locales/bn";
import en from "./locales/en";
import hi from "./locales/hi";
import pa from "./locales/pa";
import ta from "./locales/ta";
import type { Locale, TranslationKeys } from "./types";

export type { Locale, TranslationKeys };
export { LOCALE_LABELS, LOCALES } from "./types";

const translations: Record<Locale, TranslationKeys> = {
  en,
  hi,
  pa,
  ta,
  bn,
};

export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] ?? translations.en;
}

export const DEFAULT_LOCALE: Locale = "en";
