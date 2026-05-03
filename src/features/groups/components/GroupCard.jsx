import React from "react";
import { Link } from "react-router-dom";
import { useDeleteGroup } from "../hooks/useDeleteGroup";
import { getPlatform } from "../../../lib/platforms";

export default function GroupCard({ group }) {
  const { id, title, description, topic, country, date, city, platform } =
    group;

  const { mutate: deleteGroup, isPending } = useDeleteGroup();
  const platformInfo = getPlatform(platform);

  return (
    <div className="flex flex-col min-w-70  max-w-70 border-gray-200 bg-[#f5f5f7] dark:bg-[#121213] rounded-4xl pt-6 pb-3 px-6 hover:scale-105 transition-all duration-200 relative group overflow-hidden border shadow-lg hover:shadow-2xl hover:border-gray-300 dark:border-black dark:hover:border-[#333336]">
      {/* Subject Tag & Platform */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-wrap  gap-2">
          <span className="bg-white dark:bg-black text-[10px] font-bold text-black dark:text-white px-3 py-1 rounded-full uppercase tracking-widest border border-gray-100 dark:border-[#333336]">
            {topic}
          </span>
          {platform && (
            <span
              className={`flex items-center bg-white dark:bg-black text-[10px] font-bold px-3 py-1 rounded-full border border-gray-100 dark:border-[#333336] ${platformInfo.color}`}
            >
              {React.createElement(platformInfo.icon, {
                className: "mr-1 text-xs",
              })}{" "}
              {platformInfo.label}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            if (window.confirm("Remove this group?")) deleteGroup(id);
          }}
          disabled={isPending}
          className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 border-b border-gray-400/50 dark:border-[#333336]/50 pb-10 mb-2">
        <h3 className="text-[14px] md:text-[16px] lg:text-[18px] font-black text-black dark:text-white mb-3 tracking-tighter leading-tight">
          {title}
        </h3>
        <p className="text-[8px] md:text-[10px] lg:text-[12px]   text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed font-medium  truncate">
          {description}
        </p>
      </div>

      <div className=" grid grid-cols-1 ">
        <a
          href={group.meeting_link}
          target="_blank"
          rel="noreferrer"
          className=" mx-auto text-[12px] md:text-[14px] lg:text-[16px] px-6 text-center dark:text-gray-500 
          hover:text-white rounded-full
          text-black hover:bg-black font-bold    dark:hover:bg-white  dark:hover:text-black hover:shadow-lg py-2 transition-all duration-200 cursor-pointer"
        >
          Connect now
        </a>
        <Link
          to={`/groups/${id}`}
          className="w-[70%] mx-auto text-[12px] md:text-[14px] lg:text-[16px]  text-center border-black  dark:text-gray-500 
          hover:text-white rounded-full
          text-black hover:bg-black font-bold   dark:hover:bg-white dark:hover:text-black hover:shadow-lg py-2 mb-3 transition-all duration-200 cursor-pointer"
        >
          View Details
        </Link>
      </div>
      <div className="flex flex-col gap-3 pt-4 pb-0.5 border-t border-gray-400/50 dark:border-[#333336]/50">
        {country && (
          <span className="flex items-center   text-[8px] md:text-[10px] lg:text-[12px] text-gray-400 dark:text-gray-500 font-bold uppercase">
            <svg
              className="w-3 h-3 text-red-500/50 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p className="truncate">{[city, country]?.join(", ")}</p>
          </span>
        )}
      </div>
    </div>
  );
}
