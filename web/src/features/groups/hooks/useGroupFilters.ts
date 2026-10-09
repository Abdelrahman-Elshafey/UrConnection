import { TOPICS, isPlatformKey, type GroupListParams, type Topic } from "@urconnections/shared";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { readSavedSearch, saveSearch } from "../utils/savedSearch";
import { useUserLocation } from "./useUserLocation";

/** What the filter bar shows. Empty string = "no filter"; topic "All" = no topic filter. */
export interface HomeFilters {
  query: string;
  topic: string;
  country: string;
  city: string;
  platform: string;
}

export type FilterKey = keyof HomeFilters;

const isTopic = (value: string): value is Topic => (TOPICS as readonly string[]).includes(value);

/**
 * Home page filters with the URL as the single source of truth (audit O1).
 *   /?topic=Math&country=Egypt  →  filters = { topic: "Math", country: "Egypt", ... }
 * Changing a filter changes the URL, so filtered pages can be bookmarked and shared,
 * and the browser's back button works.
 *
 * On a visit to "/" without filters, exactly one of these happens:
 *   1. a saved search exists for this tab → restore it (e.g. after clicking the logo)
 *   2. the user cleared the filters before (saved "") → stay on "all groups"
 *   3. first visit → pre-select the user's country/city once their location is known
 */
export function useGroupFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { country: detectedCountry, city: detectedCity, isDetecting } = useUserLocation();
  const initialized = useRef(false);

  const filters: HomeFilters = {
    query: searchParams.get("query") ?? "",
    topic: searchParams.get("topic") ?? "All",
    country: searchParams.get("country") ?? "",
    city: searchParams.get("city") ?? "",
    platform: searchParams.get("platform") ?? "",
  };

  // What the API gets. Unknown values from a hand-edited URL (topic=Cooking) are dropped
  // here, so they show as "no filter" instead of producing a 400 from the API.
  const apiParams: Omit<GroupListParams, "cursor" | "limit"> = {
    ...(filters.query && { query: filters.query }),
    ...(isTopic(filters.topic) && { topic: filters.topic }),
    ...(filters.country && { country: filters.country }),
    ...(filters.country && filters.city && { city: filters.city }),
    ...(isPlatformKey(filters.platform) && { platform: filters.platform }),
  };

  /** Replace the URL's filter params (replace: true, so filter tweaks don't flood the back button). */
  const writeUrl = (next: URLSearchParams) => {
    saveSearch(next.toString());
    setSearchParams(next, { replace: true });
  };

  const setFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && !(key === "topic" && value === "All")) next.set(key, value);
    else next.delete(key);
    if (key === "country") next.delete("city"); // a city only makes sense inside its country
    writeUrl(next);
  };

  const clearFilters = () => writeUrl(new URLSearchParams());

  // Runs once per visit, as soon as there is enough information to decide (see the list above).
  useEffect(() => {
    if (initialized.current) return;

    if (searchParams.toString() !== "") {
      // Arrived with filters (shared link, back button): they win; remember them.
      initialized.current = true;
      saveSearch(searchParams.toString());
      return;
    }

    const saved = readSavedSearch();
    if (saved !== null) {
      initialized.current = true;
      if (saved !== "") setSearchParams(new URLSearchParams(saved), { replace: true });
      return;
    }

    if (isDetecting) return; // wait for the location, then this effect runs again
    initialized.current = true;
    if (detectedCountry) {
      const next = new URLSearchParams({ country: detectedCountry });
      if (detectedCity) next.set("city", detectedCity);
      writeUrl(next);
    }
    // searchParams/writeUrl change on every render; the ref makes this run its logic once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetecting, detectedCountry, detectedCity]);

  const hasActiveFilters = Object.keys(apiParams).length > 0;

  return { filters, apiParams, setFilter, clearFilters, hasActiveFilters, isDetecting };
}
