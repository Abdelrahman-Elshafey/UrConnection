import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { FiCheck, FiChevronDown, FiGlobe } from "react-icons/fi";
import { switchLocale, useT } from "../../i18n/i18n";
import { LOCALE_NAMES, LOCALES, type Locale } from "../../i18n/locales";
import { cx } from "../ui/cx";

/**
 * The navbar's language switch (from `sm` up): a pill with 🌐 + the current code, opening a
 * small panel with the four languages. Our own menu instead of a <select>, because a native
 * select's list is drawn by the operating system and can't follow the site's design.
 *
 * Accessibility, by hand since there is no native element doing it for us (the "disclosure"
 * pattern: a button that shows and hides a list of buttons):
 *   - aria-expanded / aria-controls tell screen readers the button opens the list;
 *   - opening moves focus to the current language; ↑ ↓ Home End move between languages;
 *   - Escape closes and returns focus to the button; Tab away or a click outside closes too;
 *   - aria-current marks the active language, lang on each name picks the right voice.
 */
export default function LanguageMenu() {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // While open: a press anywhere outside closes it. (pointerdown, not click: it closes before
  // the press does anything else, e.g. before a link elsewhere starts navigating.)
  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [open]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const choose = (code: Locale) => {
    switchLocale(code);
    close();
  };

  const onPanelKeyDown = (e: KeyboardEvent) => {
    const items = itemRefs.current.filter((item) => item !== null);
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const target = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: items.length - 1 }[e.key];
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (target !== undefined) {
      e.preventDefault();
      items[(target + items.length) % items.length]?.focus(); // wraps around at both ends
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      // Tab moved focus out of the button and the list: close (relatedTarget = where focus went).
      onBlur={(e) => {
        if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`${t("footer.language")}: ${LOCALE_NAMES[locale]}`}
        aria-expanded={open}
        aria-controls={panelId}
        className={cx(
          "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold uppercase tracking-widest transition-colors",
          "outline-none focus-visible:ring-2 focus-visible:ring-accent",
          open
            ? "bg-surface text-black dark:bg-surface-dark dark:text-white"
            : "text-gray-500 hover:bg-surface hover:text-black dark:text-gray-400 dark:hover:bg-surface-dark dark:hover:text-white",
        )}
      >
        <FiGlobe aria-hidden className="h-4 w-4" />
        <span aria-hidden>{locale}</span>
        <FiChevronDown aria-hidden className={cx("h-3 w-3 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <ul
          id={panelId}
          onKeyDown={onPanelKeyDown}
          // starting: = the first frame when it appears; the browser animates from there (CSS only).
          className="absolute right-0 top-full z-10 mt-2 w-44 origin-top-right rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl transition-[opacity,scale] duration-150 ease-out starting:scale-95 starting:opacity-0 motion-reduce:transition-none dark:border-line-dark dark:bg-raised-dark/95"
        >
          {LOCALES.map((code, i) => {
            const active = code === locale;
            return (
              <li key={code}>
                <button
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  // The list appears with focus on the current language (keyboard users start there).
                  autoFocus={active}
                  onClick={() => choose(code)}
                  aria-current={active ? "true" : undefined}
                  className={cx(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold tracking-tight transition-colors",
                    "outline-none hover:bg-surface focus-visible:bg-surface dark:hover:bg-white/10 dark:focus-visible:bg-white/10",
                    active ? "text-accent" : "text-black dark:text-white",
                  )}
                >
                  <span lang={code}>{LOCALE_NAMES[code]}</span>
                  {active && <FiCheck aria-hidden className="h-4 w-4" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
