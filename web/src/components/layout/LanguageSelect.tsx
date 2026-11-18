import type { ChangeEvent } from "react";
import { FiGlobe } from "react-icons/fi";
import { switchLocale, useT } from "../../i18n/i18n";
import { isLocale, LOCALE_NAMES, LOCALES } from "../../i18n/locales";

interface LanguageSelectProps {
  /**
   * "footer": small text on the black footer. "menu": a labelled field in the phone menu.
   * "nav": a compact globe + language code in the navbar (from `sm` up).
   */
  variant?: "footer" | "menu" | "nav";
}

/**
 * The language switcher. A native <select>: keyboard and screen-reader friendly for free,
 * and on phones it opens the system picker. In the footer it is styled like the footer's
 * links; in the phone menu it gets a visible label and a field-like look.
 * Not the UI kit's SelectField on purpose: the navbar is on the home page, and importing
 * Field.tsx here would pull it out of its lazy chunk into the home bundle (+0.7 KB gzip).
 */
export default function LanguageSelect({ variant = "footer" }: LanguageSelectProps) {
  const { t, locale } = useT();

  const onChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (isLocale(e.target.value)) switchLocale(e.target.value);
  };
  // lang on each option: a screen reader says "Deutsch" with a German voice.
  const options = (optionClass?: string) =>
    LOCALES.map((code) => (
      <option key={code} value={code} lang={code} className={optionClass}>
        {LOCALE_NAMES[code]}
      </option>
    ));

  if (variant === "nav") {
    return (
      // Our own compact label (globe + "EN") with the real <select> stretched invisibly over
      // it: a click opens the browser's list with the full names, and keyboard and screen
      // readers use the select as usual (its aria-label says what it is). A visible select
      // would show the whole name ("FRANÇAIS"), too wide next to the other links at 640px.
      <div className="relative flex h-9 items-center gap-1.5 rounded-full px-2 text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-black has-focus-visible:ring-2 has-focus-visible:ring-accent dark:text-gray-400 dark:hover:text-white">
        <FiGlobe aria-hidden className="h-4 w-4" />
        <span aria-hidden>{locale}</span>
        <select aria-label={t("footer.language")} value={locale} onChange={onChange} className="absolute inset-0 cursor-pointer opacity-0">
          {options()}
        </select>
      </div>
    );
  }

  if (variant === "menu") {
    return (
      <label className="block">
        <span className="mb-2 block px-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t("footer.language")}</span>
        <select value={locale} onChange={onChange} className="w-full cursor-pointer rounded-2xl bg-surface px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-accent dark:bg-surface-dark">
          {options()}
        </select>
      </label>
    );
  }

  return (
    <select
      aria-label={t("footer.language")}
      value={locale}
      onChange={onChange}
      className="cursor-pointer bg-transparent text-xs text-gray-400 outline-none transition-colors hover:text-white focus-visible:text-white dark:text-gray-500"
    >
      {options("bg-black text-white")}
    </select>
  );
}
