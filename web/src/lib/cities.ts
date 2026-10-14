import { queryOptions, useQuery } from "@tanstack/react-query";

/**
 * The city lists (≈ 13 KB gzip) are a separate chunk: `import()` downloads it the first time
 * a country is picked, instead of with the home page (Stage 12). React Query keeps the
 * loaded function, so every later call is instant; the browser also caches the module itself.
 */
const citiesQuery = queryOptions({
  queryKey: ["cities"],
  queryFn: async () => (await import("@urconnections/shared/cities")).getCities,
  staleTime: Infinity, // static data: it only changes with a new deploy
  gcTime: Infinity,
});

/**
 * Cities of `country`. `undefined` while the list is still downloading, so a select can keep
 * showing its current city meanwhile (an <option> that doesn't exist yet can't be selected).
 * No country → [] and nothing is downloaded.
 */
export function useCities(country: string): readonly string[] | undefined {
  const { data: getCities } = useQuery({ ...citiesQuery, enabled: country !== "" });
  if (!country) return [];
  return getCities?.(country);
}

/**
 * The options for a city select: the real list, or, while it's loading, just the currently
 * chosen city (so an edit form or a filtered URL shows it straight away, not a blank select).
 */
export const cityOptions = (cities: readonly string[] | undefined, current: string): readonly string[] =>
  cities ?? (current ? [current] : []);
