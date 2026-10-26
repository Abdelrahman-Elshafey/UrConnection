import { getCities } from "@urconnections/shared/cities";
import { HttpError } from "./errors";

/**
 * The city must be one the web offers for that country (groups, sign-up, profile).
 * Checked here rather than in the shared schemas: the city lists are ≈ 13 KB gzip, which the
 * web downloads only on demand (web/src/lib/cities.ts). The country itself is already checked
 * by the shared schemas.
 * An empty city passes: a profile may leave it empty, and a group's schema already requires one.
 */
export function checkCity({ country, city }: { country: string; city: string }): void {
  if (city !== "" && !getCities(country).includes(city)) {
    throw new HttpError(400, "invalid_request", "The request is invalid", [
      { path: "city", message: "Please choose a city from the list" },
    ]);
  }
}
