import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetGroups } from "../hooks/useGetGroups";
import { useUserLocation } from "../hooks/useUserLocation";
import {
  readFilterCache,
  writeFilterCache,
  clearFilterCache,
} from "../hooks/useFilterCache";
import GroupCard from "./GroupCard";
import FilterBar from "./FilterBar";

export default function GroupList() {
  const { data: groups, isLoading, error } = useGetGroups();
  const {
    country: detectedCountry,
    city: detectedCity,
    isDetecting,
  } = useUserLocation();
  const hasInitialized = useRef(false);
  const scrollRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const scrollToResults = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const searchQuery = searchParams.get("query") || "";
  const selectedTopic = searchParams.get("topic") || "All";
  const selectedCountry = searchParams.get("country") || "";
  const selectedCity = searchParams.get("city") || "";
  const selectedPlatform = searchParams.get("platform") || "";

  const updateParam = (key, value) => {
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        if (value && value !== "All") {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
        if (key === "country") {
          newParams.delete("city");
        }
        const snapshot = Object.fromEntries(newParams.entries());
        writeFilterCache({
          query: snapshot.query || "",
          topic: snapshot.topic || "All",
          country: snapshot.country || "",
          city: snapshot.city || "",
          platform: snapshot.platform || "",
        });
        return newParams;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    const cached = readFilterCache();
    if (!cached) return;
    hasInitialized.current = true;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (cached.query) next.set("query", cached.query);
        if (cached.topic && cached.topic !== "All")
          next.set("topic", cached.topic);
        if (cached.country) next.set("country", cached.country);
        if (cached.city) next.set("city", cached.city);
        if (cached.platform) next.set("platform", cached.platform);
        return next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      !isDetecting &&
      !hasInitialized.current &&
      searchParams.toString() === ""
    ) {
      hasInitialized.current = true;
      if (detectedCountry) {
        writeFilterCache({
          query: "",
          topic: "All",
          country: detectedCountry,
          city: detectedCity || "",
          platform: "",
        });
        setSearchParams(
          (prev) => {
            prev.set("country", detectedCountry);
            if (detectedCity) {
              prev.set("city", detectedCity);
            }
            return prev;
          },
          { replace: true },
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetecting, detectedCountry, detectedCity]);

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
            onClick={() => window.location.reload()}
            className="bg-[#0071e3] text-white px-8 py-3 rounded-full font-bold text-sm tracking-widest uppercase hover:brightness-110 transition-all cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );

  const filteredGroups = groups?.filter((group) => {
    const matchesSearch =
      group.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTopic =
      selectedTopic === "All" ||
      group.topic.toLowerCase() === selectedTopic.toLowerCase();
    const matchesCountry =
      !selectedCountry ||
      (group.country || "").toLowerCase() === selectedCountry.toLowerCase();
    const matchesCity =
      !selectedCity ||
      (group.city || "").toLowerCase() === selectedCity.toLowerCase();
    const matchesPlatform =
      !selectedPlatform ||
      (group.platform || "").toLowerCase() === selectedPlatform.toLowerCase();
    return (
      matchesSearch &&
      matchesTopic &&
      matchesCountry &&
      matchesCity &&
      matchesPlatform
    );
  });

  const hasActiveFilters =
    searchQuery ||
    selectedTopic !== "All" ||
    selectedCountry ||
    selectedCity ||
    selectedPlatform;

  const handleClearFilters = () => {
    clearFilterCache();
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="w-full bg-white dark:bg-[#000000] min-h-screen transition-colors duration-200">
      <FilterBar
        onSearch={(val) => {
          updateParam("query", val);
          scrollToResults();
        }}
        onTopicChange={(val) => updateParam("topic", val)}
        currentTopic={selectedTopic}
        currentSearch={searchQuery}
        onCountryChange={(val) => updateParam("country", val)}
        onCityChange={(val) => updateParam("city", val)}
        onPlatformChange={(val) => updateParam("platform", val)}
        currentCountry={selectedCountry}
        currentCity={selectedCity}
        currentPlatform={selectedPlatform}
      />

      <div ref={scrollRef} className="max-w-[1400px] mx-auto px-6 py-10 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 px-2">
          <div className="ml-4 ">
            <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tighter mb-4">
              Explore {selectedTopic !== "All" ? selectedTopic : "Featured"}
            </h2>
            <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-[0.2em] text-[11px]">
              {filteredGroups?.length || 0} groups available in your network
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
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-[#0071e3] hover:text-[#005bb5] bg-[#0071e3]/5 px-4 py-2 rounded-full transition-colors uppercase tracking-widest cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 place-items-center  sm:grid-cols-2  lg:grid-cols-4  gap-6 ">
          {filteredGroups?.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}

          {filteredGroups?.length === 0 && (
            <div className="col-span-full py-30 text-center">
              <h3 className="text-4xl md:text-6xl font-black text-black dark:text-white mb-6 tracking-tighter">
                No groups found.
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-sm mx-auto mb-10 leading-relaxed px-6">
                Refine your discovery parameters or expand your search to global
                locations.
              </p>
              <button
                onClick={handleClearFilters}
                className="bg-black dark:bg-white text-white dark:text-black font-bold px-10 py-4 rounded-full text-sm uppercase tracking-widest hover:opacity-80 transition-all active:scale-95 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
