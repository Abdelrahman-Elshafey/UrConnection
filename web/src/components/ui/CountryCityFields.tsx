import { useFormContext, useWatch } from "react-hook-form";
import { useCountryOptions } from "../../i18n/countries";
import { useT } from "../../i18n/i18n";
import { cityOptions, useCities } from "../../lib/cities";
import { SelectField } from "./Field";

interface CountryCityFieldsProps {
  countryLabel?: string;
  cityLabel?: string;
  /** Lets the user leave both empty (sign-up, profile). */
  optional?: boolean;
  onSurface?: boolean;
}

/** The only fields this component touches. Any form that has them can use it. */
interface CountryCity {
  country: string;
  city: string;
}

/**
 * Linked Country → City selects for any react-hook-form form (audit D4): the city list
 * follows the country, and changing the country clears the city.
 *
 * It finds its form through React context (useFormContext), so the page wraps its <form>
 * in <FormProvider {...form}> instead of passing register/setValue/errors down by hand.
 */
export function CountryCityFields({ countryLabel, cityLabel, optional = false, onSurface }: CountryCityFieldsProps) {
  const { t } = useT();
  // Names in the visitor's language, sorted for it; each option's value stays the English name.
  const countries = useCountryOptions();
  const { register, setValue, control, formState } = useFormContext<CountryCity>();
  const country = useWatch({ control, name: "country" });
  const city = useWatch({ control, name: "city" });
  // Loaded on demand (lib/cities.ts); until then the current city stays selectable.
  const cities = cityOptions(useCities(country), city);
  // "City" → "City (optional)", word order per language ("{label} (optional)" in en.ts).
  const withSuffix = (label: string) => (optional ? t("fields.optional", { label }) : label);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <SelectField
        label={withSuffix(countryLabel ?? t("fields.country"))}
        error={formState.errors.country?.message}
        onSurface={onSurface}
        {...register("country", { onChange: () => setValue("city", "", { shouldDirty: true }) })}
      >
        <option value="" disabled={!optional}>
          {t("fields.selectCountry")}
        </option>
        {countries.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <SelectField
        label={withSuffix(cityLabel ?? t("fields.city"))}
        error={formState.errors.city?.message}
        onSurface={onSurface}
        disabled={!country}
        {...register("city")}
      >
        <option value="" disabled={!optional}>
          {t(country ? "fields.selectCity" : "fields.selectCountryFirst")}
        </option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </SelectField>
    </div>
  );
}
