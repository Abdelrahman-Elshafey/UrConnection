import { useState, useEffect } from "react";
import { COUNTRY_LIST, COUNTRIES_CITIES } from "../../../lib/countries";
import { PLATFORMS } from "../../../lib/platforms";

const TOPICS = [
  "All",
  "Programming",
  "Language",
  "Math",
  "Science",
  "Design",
  "Business",
  "Art",
];

export default function FilterBar({
  onSearch,
  onTopicChange,
  currentTopic,
  onCountryChange,
  onCityChange,
  onPlatformChange,
  currentCountry,
  currentCity,
  currentPlatform,
  currentSearch,
}) {
  const [search, setSearch] = useState(currentSearch || "");

  useEffect(() => {
    setSearch(currentSearch || "");
  }, [currentSearch]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = () => {
    onSearch(search);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const availableCities = currentCountry
    ? COUNTRIES_CITIES[currentCountry]
    : [];

  return (
    <>
      {/* Immersive Hero Section */}
      <section className="w-full bg-[#f5f5f7] dark:bg-[#000000] py-20 transition-colors duration-200 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none opacity-20 dark:opacity-10"></div>

        <div className="max-w-6xl mx-auto flex flex-col items-center relative z-10">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-black dark:text-white mb-8 tracking-tighter text-center leading-[0.9] flex flex-col">
            <span>Find your</span>
            <span className="text-[#0071e3]">Connections.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium mb-16 text-center max-w-2xl leading-relaxed">
            Discover elite communities focused on growth, learning, and local
            networking.
          </p>

          {/* Search Inputs */}
          <div className="w-full max-w-2xl flex items-center bg-white dark:bg-[#1d1d1f] rounded-[40px] drop-shadow-lg shadow-gray-400/50 dark:shadow-none  border-gray-300 dark:border-[#1d1d1f] transition-all   pl-6  group">
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                placeholder="Find your group by Interest"
                className="w-full focus:placeholder:text-transparent bg-transparent text-xl font-bold outline-none text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
              />
            </div>
            <button
              onClick={handleSearchSubmit}
              className="bg-black border  text-white py-4 px-14 rounded-full hover:scale-105 active:scale-110 transition-all duration-500 cursor-pointer flex items-center justify-center"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Global Discovery Bar (Sticky) */}
      <div className="sticky top-[61px] z-40 bg-white/70 dark:bg-[#000000]/70 backdrop-blur-2xl border-b border-gray-100 dark:border-[#1d1d1f] py-4 px-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-center justify-between gap-6">
         

          <div className="flex flex-wrap justify-center overflow-x-auto hide-scrollbar gap-3 items-center flex-1">
            <select
              className="bg-gray-50 dark:bg-[#1d1d1f] text-[12px] md:text-[16px] lg:text-[18px] font-bold px-1 py-3 text-center rounded-3xl border border-transparent focus:border-[#0071e3] transition-all cursor-pointer text-black dark:text-white"
              value={currentCountry || ""}
              onChange={(e) => onCountryChange(e.target.value)}
            >
              <option value="">Global</option>
              {COUNTRY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className={`bg-gray-50 dark:bg-[#1d1d1f] text-[12px] md:text-[16px] lg:text-[18px] font-bold px-0.5 py-3 text-center rounded-3xl border border-transparent focus:border-[#0071e3] transition-all cursor-pointer text-black dark:text-white ${!currentCountry ? "opacity-50 pointer-events-none" : " "}`}
              value={currentCity}
              disabled={!currentCountry}
              onChange={(e) => onCityChange(e.target.value)}
            >
              <option value="">All Cities</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              className="bg-gray-50 dark:bg-[#1d1d1f] text-[12px] md:text-[16px] lg:text-[18px]  font-bold px-0.5 py-3 text-center rounded-3xl border border-transparent focus:border-[#0071e3] transition-all cursor-pointer text-black dark:text-white"
              value={currentPlatform}
              onChange={(e) => onPlatformChange(e.target.value)}
            >
              <option value="">All Platforms</option>
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
         <div className="flex mt-4 flex-wrap justify-center overflow-x-auto hide-scrollbar gap-2 items-center flex-1">
            {TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => onTopicChange(topic)}
                className={`px-5 py-2 rounded-full text-[14px] md:text-[18px] lg:text-[22px] font-bold transition-all shrink-0 border border-transparent cursor-pointer ${
                  currentTopic === topic
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-lg"
                    : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
      </div>
    </>
  );
}
