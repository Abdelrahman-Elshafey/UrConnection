// Short-lived memory of the home page filters (sessionStorage, 1-minute TTL).
// Plain functions, not a hook (renamed from hooks/useFilterCache.js, audit H5).
// Stage 5 replaces this with useGroupFilters() (URL as the single source of truth, O1).

const CACHE_KEY = "uc_filter_cache";
const TTL_MS = 60 * 1000; // 1 minute

export interface GroupFilters {
  query: string;
  topic: string; // a Topic or "All"
  country: string;
  city: string;
  platform: string;
}

interface CacheEntry {
  filters: GroupFilters;
  expiresAt: number;
}

/** Returns the cached filters, or null if absent, expired, or unreadable. */
export function readFilterCache(): GroupFilters | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    // JSON.parse returns `any`; annotate what we expect (and tolerate garbage via try/catch).
    const { filters, expiresAt } = JSON.parse(raw) as CacheEntry;
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return filters;
  } catch {
    return null;
  }
}

/** Saves the filters with a fresh 1-minute TTL. */
export function writeFilterCache(filters: GroupFilters): void {
  try {
    const entry: CacheEntry = { filters, expiresAt: Date.now() + TTL_MS };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Quota exceeded or private browsing: silently skip
  }
}

export function clearFilterCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
