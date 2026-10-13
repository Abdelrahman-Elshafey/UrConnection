import { useRef } from "react";
import { useGroupFilters } from "../hooks/useGroupFilters";
import { useGroups } from "../hooks/useGroups";
import GroupCard from "./GroupCard";
import FilterBar from "./FilterBar";
import { pageTitle } from "../../../lib/pageTitle";

export default function GroupList() {
  // Filters live in the URL (useGroupFilters); the API does the filtering (useGroups).
  const { filters, apiParams, setFilter, clearFilters, hasActiveFilters, isDetecting } = useGroupFilters();
  const { groups, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGroups(apiParams);
  const scrollRef = useRef(null);

  const scrollToResults = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-[#000000]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-[3px] border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] animate-pulse">
            Initializing Experience
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center p-20 bg-white dark:bg-[#000000]">
        <div className="w-full max-w-2xl bg-[#f5f5f7] dark:bg-[#1d1d1f] p-12 rounded-[40px] text-center border border-gray-100 dark:border-[#1d1d1f]">
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            {error.message}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-[#0071e3] text-white px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase hover:brightness-110 transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );

  return (
    <div className="w-full bg-white dark:bg-[#000000] min-h-screen transition-colors duration-200">
      <title>{pageTitle()}</title>
      <FilterBar
        filters={filters}
        onChange={setFilter}
        onSearch={(val) => {
          setFilter("query", val);
          scrollToResults();
        }}
      />

      <div ref={scrollRef} className="max-w-350 mx-auto px-6 py-10 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
          <div className="ml-4 ">
            <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tighter mb-4">
              Explore {filters.topic !== "All" ? filters.topic : "Featured"}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] text-[11px]">
              {/* Only loaded pages are known; "+" means more can be loaded. */}
              {groups.length}
              {hasNextPage ? "+" : ""} groups available in your network
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isDetecting && (
              <span className="flex items-center gap-3 bg-gray-50 dark:bg-[#1d1d1f] text-black dark:text-white text-[10px] font-bold px-4 py-2 rounded-full border border-gray-100 dark:border-[#333336]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0071e3] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0071e3]"></span>
                </span>
                Detecting Location
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-[#0071e3] hover:text-[#005bb5] bg-[#0071e3]/5 px-4 py-2 rounded-full transition-colors uppercase tracking-widest cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 place-items-center  sm:grid-cols-2  lg:grid-cols-4  gap-6 ">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}

          {groups.length === 0 && (
            <div className="col-span-full py-30 text-center">
              <h3 className="text-4xl md:text-6xl font-black text-black dark:text-white mb-6 tracking-tighter">
                No groups found.
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-sm mx-auto mb-10 leading-relaxed px-6">
                Refine your discovery parameters or expand your search to global
                locations.
              </p>
              <button
                onClick={clearFilters}
                className="bg-black dark:bg-white text-white dark:text-black font-bold px-10 py-4 rounded-full text-sm uppercase tracking-widest hover:opacity-80 transition-all active:scale-95 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {hasNextPage && (
          <div className="flex justify-center mt-16">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="bg-black dark:bg-white text-white dark:text-black font-bold px-10 py-4 rounded-full text-sm uppercase tracking-widest hover:opacity-80 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-3"
            >
              {isFetchingNextPage && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
              )}
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
