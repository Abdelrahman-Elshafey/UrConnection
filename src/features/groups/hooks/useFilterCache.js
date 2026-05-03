const CACHE_KEY = 'uc_filter_cache';
const TTL_MS = 60 * 1000; // 1 minute

/**
 * Reads the cached filter state from sessionStorage.
 * Returns null if the cache is absent or expired.
 */
export function readFilterCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const { filters, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return filters; // { query, topic, country, city, platform }
  } catch {
    return null;
  }
}

/**
 * Writes the current filter state to sessionStorage with a fresh 1-minute TTL.
 * @param {Object} filters - { query, topic, country, city, platform }
 */
export function writeFilterCache(filters) {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ filters, expiresAt: Date.now() + TTL_MS })
    );
  } catch {
    // Quota exceeded or private browsing — silently skip
  }
}

/**
 * Clears the filter cache immediately.
 */
export function clearFilterCache() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
