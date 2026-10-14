import { useQuery } from "@tanstack/react-query";
import { COUNTRY_LIST, isCountry } from "@urconnections/shared";

const LOCATION_STORAGE_KEY = "ur_connections_user_location";
const LOCATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // re-detect weekly (people move)

/** A detected location. Empty strings mean "unknown". */
interface UserLocation {
  country: string;
  city: string;
}

/** The two fields we read from https://ipapi.co/json/ (the response has many more). */
interface IpApiResponse {
  country_name?: string;
  city?: string;
}

/** Common API-to-local country name mappings. */
const COUNTRY_ALIASES: Record<string, string> = {
  "United States of America": "United States",
  USA: "United States",
  US: "United States",
  UK: "United Kingdom",
  "Great Britain": "United Kingdom",
  "Republic of Korea": "South Korea",
  Korea: "South Korea",
  "Czech Republic": "Czechia",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "Bosnia & Herzegovina": "Bosnia and Herzegovina",
  UAE: "United Arab Emirates",
};

/**
 * Maps the API's country name to one of our COUNTRY_LIST names.
 * Handles common discrepancies between API names and our stored names.
 */
function findMatchingCountry(apiCountry: string | undefined): string {
  if (!apiCountry) return "";

  // Direct match
  if (isCountry(apiCountry)) return apiCountry;

  // Known alias. With noUncheckedIndexedAccess the lookup is `string | undefined`,
  // so TypeScript makes us handle the "no alias" case.
  const alias = COUNTRY_ALIASES[apiCountry];
  if (alias) return alias;

  // Case-insensitive match
  const lowerApi = apiCountry.toLowerCase();
  return COUNTRY_LIST.find((c) => c.toLowerCase() === lowerApi) ?? "";
}

/** Finds a matching city within the country's city list. */
async function findMatchingCity(country: string, apiCity: string | undefined): Promise<string> {
  if (!country || !apiCity) return "";
  // The city lists are their own chunk (Stage 12): only download them when there's a city to match.
  // If that download fails, keep the detected country and just leave the city empty.
  const citiesModule = await import("@urconnections/shared/cities").catch(() => null);
  const cities = citiesModule?.getCities(country) ?? [];
  if (cities.length === 0) return "";

  // Direct match
  if (cities.includes(apiCity)) return apiCity;

  // Case-insensitive match
  const lowerApi = apiCity.toLowerCase();
  return cities.find((c) => c.toLowerCase() === lowerApi) ?? "";
}

const EMPTY_LOCATION: UserLocation = { country: "", city: "" };

/**
 * 1. Returns the localStorage result if it is younger than LOCATION_TTL_MS.
 * 2. Otherwise calls the IP-based geolocation API.
 * 3. Caches the result in localStorage for future visits.
 * Never throws: on any failure it returns an empty location.
 */
async function fetchLocation(): Promise<UserLocation> {
  // 1. localStorage cache (entries without savedAt are pre-TTL → treated as expired)
  try {
    const cached = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (cached) {
      // Data from storage is untrusted: every field may be missing.
      const { country, city, savedAt } = JSON.parse(cached) as Partial<UserLocation & { savedAt: number }>;
      if (country !== undefined && city !== undefined && savedAt !== undefined && Date.now() - savedAt < LOCATION_TTL_MS) {
        return { country, city };
      }
    }
  } catch {
    // Ignore parse errors and proceed to the API call
  }

  // 2. IP geolocation API
  try {
    const response = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    if (!response.ok) throw new Error("API request failed");

    const data = (await response.json()) as IpApiResponse;

    const country = findMatchingCountry(data.country_name);
    const result: UserLocation = { country, city: await findMatchingCity(country, data.city) };

    // 3. Cache for future visits
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify({ ...result, savedAt: Date.now() }));

    return result;
  } catch {
    // Silently fail: filters just stay empty
    return EMPTY_LOCATION;
  }
}

/**
 * Detects the user's country and city on first visit.
 * staleTime: Infinity, because location doesn't change mid-session.
 */
export function useUserLocation(): UserLocation & { isDetecting: boolean } {
  const { data, isPending } = useQuery({
    queryKey: ["userLocation"],
    queryFn: fetchLocation,
    staleTime: Infinity,
  });

  return {
    country: data?.country ?? "",
    city: data?.city ?? "",
    isDetecting: isPending,
  };
}
