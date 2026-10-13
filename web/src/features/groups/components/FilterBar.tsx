import { COUNTRY_LIST, TOPICS, getCities } from "@urconnections/shared";
import { useRef, type ComponentProps } from "react";
import { cx } from "../../../components/ui/cx";
import { PageHero } from "../../../components/ui/PageHero";
import { PLATFORMS } from "../../../lib/platforms";
import type { FilterKey, HomeFilters } from "../hooks/useGroupFilters";

// "All" is a filter-only option, not a real topic.
const TOPIC_PILLS = ["All", ...TOPICS] as const;

interface FilterBarProps {
  /** The current values (from the URL, see useGroupFilters). */
  filters: HomeFilters;
  /** One callback for every filter. */
  onChange: (key: FilterKey, value: string) => void;
  /** The search text was submitted (the page also scrolls to the results). */
  onSearch: (query: string) => void;
}

/** A compact select for the sticky bar. Each one needs an aria-label: there's no visible label (audit A2). */
function FilterSelect({ className, ...props }: ComponentProps<"select"> & { "aria-label": string }) {
  return (
    <select
      {...props}
      className={cx(
        "rounded-3xl border border-transparent bg-gray-50 px-1 py-3 text-center text-sm font-bold text-black transition-all focus:border-accent disabled:pointer-events-none disabled:opacity-50 dark:bg-raised-dark dark:text-white md:text-base lg:text-lg",
        className,
      )}
    />
  );
}

/** The home page's search box and filters. */
export default function FilterBar({ filters, onChange, onSearch }: FilterBarProps) {
  // Uncontrolled: the input keeps its own draft text; `key` below resets it whenever the
  // committed query in the URL changes (e.g. "Clear all").
  const searchRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <section className="relative w-full overflow-hidden bg-surface py-20 transition-colors duration-200 dark:bg-black">
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-4">
          <PageHero lead="Find your" accent="Connections." align="center" intro="Discover elite communities focused on growth, learning, and local networking." className="mb-16" />

          {/* A <search> landmark + a real form: Enter submits, and screen readers can jump here. */}
          <search className="w-full max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(searchRef.current?.value ?? "");
              }}
              className="flex w-full items-center rounded-[40px] bg-white pl-6 drop-shadow-lg dark:bg-raised-dark"
            >
              <input
                key={filters.query}
                ref={searchRef}
                type="search"
                aria-label="Search groups"
                placeholder="Find your group by Interest"
                defaultValue={filters.query}
                className="w-full flex-1 bg-transparent text-xl font-bold text-black outline-none placeholder-gray-300 focus:placeholder:text-transparent dark:text-white dark:placeholder-gray-600"
              />
              <button type="submit" className="rounded-full bg-black px-14 py-4 text-white transition-all duration-500 hover:scale-105 active:scale-110">
                Search
              </button>
            </form>
          </search>
        </div>
      </section>

      {/* Sticky filter bar under the nav */}
      <div className="sticky top-(--nav-height) z-40 border-b border-gray-100 bg-white/70 px-6 py-4 backdrop-blur-2xl transition-colors duration-200 dark:border-raised-dark dark:bg-black/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3">
          <FilterSelect aria-label="Country" value={filters.country} onChange={(e) => onChange("country", e.target.value)}>
            <option value="">Global</option>
            {COUNTRY_LIST.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect aria-label="City" value={filters.city} disabled={!filters.country} onChange={(e) => onChange("city", e.target.value)}>
            <option value="">All Cities</option>
            {getCities(filters.country).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect aria-label="Platform" value={filters.platform} onChange={(e) => onChange("platform", e.target.value)}>
            <option value="">All Platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </FilterSelect>
        </div>

        <div role="group" aria-label="Topic" className="hide-scrollbar mt-4 flex flex-wrap items-center justify-center gap-2 overflow-x-auto">
          {TOPIC_PILLS.map((topic) => {
            const selected = filters.topic === topic;
            return (
              <button
                key={topic}
                onClick={() => onChange("topic", topic)}
                // Toggle buttons announce whether they're on (audit A4).
                aria-pressed={selected}
                className={cx(
                  "shrink-0 rounded-full border border-transparent px-5 py-2 text-sm font-bold transition-all md:text-lg lg:text-xl",
                  selected ? "bg-black text-white shadow-lg dark:bg-white dark:text-black" : "text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white",
                )}
              >
                {topic}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
