import { setLocale, useT } from "../../i18n/i18n";
import { isLocale, LOCALE_NAMES, LOCALES } from "../../i18n/locales";

/**
 * The footer's language switcher. A native <select>: keyboard and screen-reader friendly
 * for free, and on phones it opens the system picker. Styled like the footer's links so the
 * design doesn't change.
 */
export default function LanguageSelect() {
  const { t, locale } = useT();

  return (
    <select
      aria-label={t("footer.language")}
      value={locale}
      onChange={(e) => {
        if (isLocale(e.target.value)) void setLocale(e.target.value);
      }}
      className="cursor-pointer bg-transparent text-xs text-gray-400 outline-none transition-colors hover:text-white focus-visible:text-white dark:text-gray-500"
    >
      {LOCALES.map((code) => (
        // lang on each option: a screen reader says "Deutsch" with a German voice.
        <option key={code} value={code} lang={code} className="bg-black text-white">
          {LOCALE_NAMES[code]}
        </option>
      ))}
    </select>
  );
}
