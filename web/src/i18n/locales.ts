/**
 * The languages the website speaks. English is the source language: every text is written
 * in messages/en.ts first, and the other files translate it.
 *
 * Why codes like "de" and not "de-DE": we have one German, one French, one Italian. The
 * browser reports "de-AT", "fr-CA", ... and we match on the part before the dash.
 */
export const LOCALES = ["en", "it", "de", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Each language's name in that language ("Deutsch", not "German"): someone who can't read
 * the current language must still find their own in the switcher.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  it: "Italiano",
  de: "Deutsch",
  fr: "Français",
};

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** localStorage key for the language the visitor picked in the switcher. */
const STORAGE_KEY = "locale";

/**
 * The language to start with: the visitor's own choice from an earlier visit, otherwise the
 * first browser language we support (navigator.languages is the user's ordered preference
 * list from the browser settings), otherwise English.
 */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLocale(saved)) return saved;
  } catch {
    // Storage can be blocked (private mode, strict privacy settings): just detect again.
  }
  for (const tag of navigator.languages ?? [navigator.language]) {
    const [base = ""] = tag.toLowerCase().split("-");
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function saveLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Not saved: the next visit falls back to the browser language. Nothing breaks.
  }
}
