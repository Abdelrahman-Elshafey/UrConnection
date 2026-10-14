import type { Group } from "@urconnections/shared";
import { useRef, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { PageSpinner } from "../../../components/ui/Spinner";
import { pageTitle } from "../../../lib/pageTitle";
import { useGroupFilters } from "../hooks/useGroupFilters";
import { useGroups } from "../hooks/useGroups";
import DeleteGroupDialog from "./DeleteGroupDialog";
import FilterBar from "./FilterBar";
import GroupCard from "./GroupCard";

/** The home page: search, filters, and the matching groups ("Load more" for the next page). */
export default function GroupList() {
  // Filters live in the URL (useGroupFilters); the API does the filtering (useGroups).
  const { filters, apiParams, setFilter, clearFilters, hasActiveFilters, isDetecting } = useGroupFilters();
  const { groups, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useGroups(apiParams);
  const [toDelete, setToDelete] = useState<Group | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  if (isLoading) return <PageSpinner label="Initializing Experience" />;

  if (error) {
    return (
      <div className="flex justify-center bg-white p-20 dark:bg-black">
        <div className="w-full max-w-2xl rounded-[40px] bg-surface p-12 text-center dark:bg-raised-dark">
          <p className="mb-8 font-medium text-gray-500 dark:text-gray-400">{error.message}</p>
          <Button onClick={() => refetch()} size="sm">
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white transition-colors duration-200 dark:bg-black">
      <title>{pageTitle()}</title>
      <FilterBar
        filters={filters}
        onChange={setFilter}
        onSearch={(query) => {
          setFilter("query", query);
          resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <div ref={resultsRef} className="mx-auto max-w-350 scroll-mt-24 px-6 py-10">
        <div className="mb-16 flex flex-col justify-between gap-8 px-2 md:flex-row md:items-end">
          <div className="ml-4">
            <h2 className="mb-4 text-4xl font-black tracking-tighter text-black dark:text-white md:text-5xl">
              Explore {filters.topic !== "All" ? filters.topic : "Featured"}
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
              {/* Only loaded pages are known; "+" means more can be loaded. */}
              {groups.length}
              {hasNextPage ? "+" : ""} groups available in your network
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isDetecting && (
              <span role="status" className="flex items-center gap-3 rounded-full border border-gray-100 bg-gray-50 px-4 py-2 text-[11px] font-bold text-black dark:border-line-dark dark:bg-raised-dark dark:text-white">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
                Detecting Location
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="rounded-full bg-accent/5 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-accent transition-colors hover:text-accent-strong"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* justify-items-center, not place-items-center: cards keep the default align "stretch",
            so every card in a row is as tall as the tallest one. */}
        <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onDelete={setToDelete} />
          ))}

          {groups.length === 0 && (
            <div className="col-span-full py-30 text-center">
              <h3 className="mb-6 text-4xl font-black tracking-tighter text-black dark:text-white md:text-6xl">No groups found.</h3>
              <p className="mx-auto mb-10 max-w-sm px-6 text-lg font-medium leading-relaxed text-gray-500 dark:text-gray-400">
                Refine your discovery parameters or expand your search to global locations.
              </p>
              <Button variant="dark" onClick={clearFilters} className="uppercase tracking-widest">
                Reset Filters
              </Button>
            </div>
          )}
        </div>

        {hasNextPage && (
          <div className="mt-16 flex justify-center">
            <Button variant="dark" onClick={() => fetchNextPage()} loading={isFetchingNextPage} className="uppercase tracking-widest">
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>

      <DeleteGroupDialog group={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}
