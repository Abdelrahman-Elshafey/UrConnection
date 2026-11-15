import { COUNTRY_LIST, isCountry, type Country } from "@urconnections/shared";
import { useMemo } from "react";
import { COUNTRY_CODES } from "./countryCodes";
import { useT } from "./i18n";
import type { Locale } from "./locales";

/*
 * Country names in the visitor's language. The *value* (in forms, URLs, the database) is
 * always the English name from COUNTRY_LIST; only the text people read changes.
 *
 * Intl.DisplayNames is built into every modern browser and already knows every country in
 * every language, so these translations cost 0 bytes of download.
 */

// One DisplayNames object per language, made on first use (creating one is not free).
const displayNames = new Map<Locale, Intl.DisplayNames>();

function namesFor(locale: Locale): Intl.DisplayNames {
  let names = displayNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: "region" });
    displayNames.set(locale, names);
  }
  return names;
}

/**
 * "Germany" → "Deutschland" (de). English keeps our own names exactly as stored. Anything
 * that is not one of our countries (old data, "") comes back unchanged.
 */
export function countryName(country: string, locale: Locale): string {
  if (locale === "en" || !isCountry(country)) return country;
  return namesFor(locale).of(COUNTRY_CODES[country]) ?? country;
}

/** countryName for the current language, for components: const name = useCountryName(); name("Italy"). */
export function useCountryName(): (country: string) => string {
  const { locale } = useT();
  return (country) => countryName(country, locale);
}

export interface CountryOption {
  value: Country;
  label: string;
}

/**
 * Every country as { value, label } for a <select>, sorted by the *translated* name: in
 * German "Deutschland" belongs under D, not where "Germany" was. Intl.Collator sorts the
 * way each language expects ("Ägypten" next to "Afghanistan", "Équateur" under E).
 * useMemo: sorting 118 names only reruns when the language changes.
 */
export function useCountryOptions(): CountryOption[] {
  const { locale } = useT();
  return useMemo(() => {
    const options = COUNTRY_LIST.map((value) => ({ value, label: countryName(value, locale) }));
    if (locale === "en") return options; // COUNTRY_LIST is already alphabetical
    const collator = new Intl.Collator(locale);
    return options.sort((a, b) => collator.compare(a.label, b.label));
  }, [locale]);
}
