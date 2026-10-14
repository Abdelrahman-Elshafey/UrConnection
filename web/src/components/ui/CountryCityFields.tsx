import { COUNTRY_LIST } from "@urconnections/shared";
import { useFormContext, useWatch } from "react-hook-form";
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
export function CountryCityFields({ countryLabel = "Country", cityLabel = "City", optional = false, onSurface }: CountryCityFieldsProps) {
  const { register, setValue, control, formState } = useFormContext<CountryCity>();
  const country = useWatch({ control, name: "country" });
  const city = useWatch({ control, name: "city" });
  // Loaded on demand (lib/cities.ts); until then the current city stays selectable.
  const cities = cityOptions(useCities(country), city);
  const suffix = optional ? " (optional)" : "";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <SelectField
        label={countryLabel + suffix}
        error={formState.errors.country?.message}
        onSurface={onSurface}
        {...register("country", { onChange: () => setValue("city", "", { shouldDirty: true }) })}
      >
        <option value="" disabled={!optional}>
          Select country
        </option>
        {COUNTRY_LIST.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </SelectField>
      <SelectField
        label={cityLabel + suffix}
        error={formState.errors.city?.message}
        onSurface={onSurface}
        disabled={!country}
        {...register("city")}
      >
        <option value="" disabled={!optional}>
          {country ? "Select city" : "Select a country first"}
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
