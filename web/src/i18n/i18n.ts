import { useSyncExternalStore } from "react";
import { DEFAULT_LOCALE, saveLocale, type Locale } from "./locales";
import { en, type Messages } from "./messages/en";

/**
 * A small translation layer of our own instead of a library such as i18next (~15–20 KB gzip
 * on the home page). Three ideas:
 *
 * 1. Lazy languages. English is bundled (it is also the fallback). Italian, German and French
 *    are separate files that Vite splits into their own chunks via import(): a visitor
 *    downloads only the one language they use.
 * 2. Typed keys. t("footer.allGroups") is checked by TypeScript: a typo fails the build.
 * 3. A tiny store. The current language lives in this module. React components subscribe with
 *    useSyncExternalStore, so changing the language re-renders everything that shows text,
 *    without a Context provider around the app.
 */

// ---- Typed keys -------------------------------------------------------------------------

/**
 * Every "group.key" path into Messages, e.g. "nav.profile" | "footer.allGroups" | ...
 * It walks the nested object: a string value is a leaf (its path is a key), an object adds
 * its name plus "." to the prefix and walks further.
 */
type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;

/** Values for `{name}` placeholders in a text. */
export type MessageVars = Record<string, string | number>;

// ---- Loading languages --------------------------------------------------------------------

// One import() per language → one chunk per language. Written out (not import(`./${x}`)) so
// Vite sees exactly which files exist.
const loaders: Record<Exclude<Locale, "en">, () => Promise<{ default: Messages }>> = {
  it: () => import("./messages/it"),
  de: () => import("./messages/de"),
  fr: () => import("./messages/fr"),
};

async function loadMessages(locale: Locale): Promise<Messages> {
  return locale === "en" ? en : (await loaders[locale]()).default;
}

// ---- The store ----------------------------------------------------------------------------

type State = { locale: Locale; messages: Messages };

// Replaced as a whole on every change (never mutated), so useSyncExternalStore can tell
// "changed" from "same" by comparing references.
let state: State = { locale: DEFAULT_LOCALE, messages: en };
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getState = () => state;

/** Loads a language, makes it current, remembers it, and re-renders every component that reads texts. */
export async function setLocale(locale: Locale): Promise<void> {
  const messages = await loadMessages(locale);
  state = { locale, messages };
  // <html lang> tells screen readers which voice to use and the browser how to hyphenate.
  document.documentElement.lang = locale;
  saveLocale(locale);
  listeners.forEach((listener) => listener());
}

/**
 * Called once in main.tsx *before* the first render, so a German visitor sees German from
 * the first paint instead of a flash of English. If the language file fails to download
 * (offline, a deploy in between), the site simply stays in English.
 */
export async function initLocale(locale: Locale): Promise<void> {
  if (locale === DEFAULT_LOCALE) return;
  await setLocale(locale).catch(() => undefined);
}

// ---- Translating --------------------------------------------------------------------------

/** Follows "a.b.c" through a messages object; undefined when a part is missing. */
function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** "Hi {name}" + { name: "Ada" } → "Hi Ada". Unknown placeholders are left as they are. */
function fill(text: string, vars?: MessageVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

/**
 * Translates `key` in the given messages. Falls back to English, then to the key itself.
 * Takes a plain string too, for texts that may or may not be keys (e.g. error messages
 * coming from shared validation schemas in a later step).
 */
function translate(messages: Messages, key: MessageKey | (string & {}), vars?: MessageVars): string {
  return fill(lookup(messages, key) ?? lookup(en, key) ?? key, vars);
}

export type TFunction = (key: MessageKey, vars?: MessageVars) => string;

// ---- Plurals ------------------------------------------------------------------------------

/**
 * Keys that come in a singular/plural pair: "groups.list.available" when en.ts has both
 * "available_one" and "available_other". (Template literal types: TypeScript strips the
 * "_one" suffix from every key and keeps the ones whose "_other" twin exists too.)
 */
type PluralBase<K> = K extends `${infer Base}_one` ? (`${Base}_other` extends MessageKey ? Base : never) : never;
// Passing the union through a generic makes the check run once per key ("distributive").
export type PluralKey = PluralBase<MessageKey>;

/**
 * Which form a number needs. Languages differ: English and German use the singular only
 * for 1, French also for 0 ("0 groupe"), and others have more forms. Intl.PluralRules knows
 * every language's rule. Our four languages only need "one" and "other"; anything else the
 * browser might answer (e.g. French "many" for millions) uses the plural.
 */
const pluralRules = new Map<Locale, Intl.PluralRules>();
function pluralForm(locale: Locale, count: number): "one" | "other" {
  let rules = pluralRules.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRules.set(locale, rules);
  }
  return rules.select(count) === "one" ? "one" : "other";
}

/**
 * tn("groups.list.available", 1) → "1 group available…", tn(…, 3) → "3 groups available…".
 * `{count}` is filled with the number unless `vars.count` says otherwise (e.g. "20+").
 */
export type TNFunction = (key: PluralKey, count: number, vars?: MessageVars) => string;

/**
 * The hook components use:
 *   const { t, tn, locale } = useT();
 *   <h1>{t("notFound.heading")}</h1>
 *   <p>{tn("groups.list.available", groups.length)}</p>   (singular or plural)
 * The component re-renders when the language changes.
 */
export function useT(): { t: TFunction; tn: TNFunction; locale: Locale } {
  const { locale, messages } = useSyncExternalStore(subscribe, getState);
  const t: TFunction = (key, vars) => translate(messages, key, vars);
  const tn: TNFunction = (key, count, vars) => translate(messages, `${key}_${pluralForm(locale, count)}`, { count, ...vars });
  return { t, tn, locale };
}
