import { useQuery } from '@tanstack/react-query';
import { COUNTRIES_CITIES } from '../../../lib/countries';

const LOCATION_STORAGE_KEY = 'ur_connections_user_location';

/**
 * Tries to find a matching country name from our COUNTRIES_CITIES map.
 * Handles common discrepancies between API names and our stored names.
 */
function findMatchingCountry(apiCountry) {
  if (!apiCountry) return '';

  // Direct match
  if (COUNTRIES_CITIES[apiCountry]) return apiCountry;

  // Common API-to-local name mappings
  const aliases = {
    'United States of America': 'United States',
    'USA': 'United States',
    'US': 'United States',
    'UK': 'United Kingdom',
    'Great Britain': 'United Kingdom',
    'Republic of Korea': 'South Korea',
    'Korea': 'South Korea',
    'Czechia': 'Czechia',
    'Czech Republic': 'Czechia',
    'Côte d\'Ivoire': 'Ivory Coast',
    'Cote d\'Ivoire': 'Ivory Coast',
    'Bosnia & Herzegovina': 'Bosnia and Herzegovina',
    'UAE': 'United Arab Emirates',
  };

  if (aliases[apiCountry]) return aliases[apiCountry];

  // Case-insensitive partial match
  const lowerApi = apiCountry.toLowerCase();
  const match = Object.keys(COUNTRIES_CITIES).find(
    (c) => c.toLowerCase() === lowerApi
  );
  return match || '';
}

/**
 * Tries to find a matching city within the country's city list.
 */
function findMatchingCity(country, apiCity) {
  if (!country || !apiCity || !COUNTRIES_CITIES[country]) return '';

  const cities = COUNTRIES_CITIES[country];

  // Direct match
  if (cities.includes(apiCity)) return apiCity;

  // Case-insensitive match
  const lowerApi = apiCity.toLowerCase();
  const match = cities.find((c) => c.toLowerCase() === lowerApi);
  return match || '';
}

const EMPTY_LOCATION = { country: '', city: '' };

/**
 * Async function that:
 * 1. Checks localStorage for a cached result first.
 * 2. If not cached, calls the IP-based geolocation API.
 * 3. Caches the result in localStorage for future sessions.
 */
async function fetchLocation() {
  // 1. Check localStorage cache first
  try {
    const cached = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.country !== undefined) return parsed;
    }
  } catch {
    // Ignore parse errors and proceed to API call
  }

  // 2. Fetch from IP geolocation API
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();

    const country = findMatchingCountry(data.country_name);
    const city = findMatchingCity(country, data.city);

    const result = { country, city };

    // 3. Cache for future visits
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(result));

    return result;
  } catch {
    // Silently fail — filters will just stay empty
    return EMPTY_LOCATION;
  }
}

/**
 * Custom hook that detects the user's country and city on first visit.
 *
 * Uses React Query for built-in caching, loading states, and error handling.
 * staleTime: Infinity means the location won't be refetched during a session
 * since an IP address rarely changes mid-session.
 *
 * Returns: { country, city, isDetecting }
 */
export function useUserLocation() {
  const { data, isPending } = useQuery({
    queryKey: ['userLocation'],
    queryFn: fetchLocation,
    staleTime: Infinity,   // Don't refetch — location doesn't change mid-session
    retry: 1,   
    refetchOnWindowFocus: false, // ❌ Don't refetch when tab regains focus
    refetchOnMount: false,           // One retry on failure
  });

  return {
    country: data?.country ?? '',
    city: data?.city ?? '',
    isDetecting: isPending,
  };
}
