import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGroup } from "../hooks/useGroup";
import { getPlatform } from "../../../lib/platforms";

export default function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { data: group, isLoading, error } = useGroup(groupId);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen bg-white dark:bg-[#000000]">
        <div className="flex flex-col items-center gap-6">
          <div className="w-12 h-12 border-[3px] border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Loading Detail</p>
        </div>
      </div>
    );

  if (error || !group)
    return (
      <div className="flex justify-center p-20 bg-white dark:bg-[#000000] h-screen">
        <div className="text-center">
          <h2 className="text-4xl font-black text-black dark:text-white mb-4 tracking-tighter">Not Found</h2>
          <button onClick={() => navigate("/")} className="text-[#0071e3] font-bold uppercase tracking-widest text-xs cursor-pointer">Return Home</button>
        </div>
      </div>
    );

  const {
    title,
    topic,
    description,
    meeting_link,
    platform,
    country,
    city,
  } = group;
  const platformInfo = getPlatform(platform);

  return (
    <div className="w-full bg-white dark:bg-[#000000] transition-colors duration-200">
      {/* Immersive Hero Band */}
      <section className="w-full bg-[#f5f5f7] dark:bg-[#0a0a0a] pt-10 pb-10 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <button
            onClick={() => navigate("/")}
            className="mb-8 flex items-center gap-2 group text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Back to Explore</span>
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="bg-black dark:bg-white text-white dark:text-black text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
              {topic}
            </span>
            {platform && (
              <span className={`flex items-center text-[10px] font-bold px-4 py-1.5 rounded-full bg-white dark:bg-black border border-gray-100 dark:border-[#333336] ${platformInfo.color}`}>
                {React.createElement(platformInfo.icon, { className: "mr-2 text-sm" })}
                {platformInfo.label}
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-4xl lg:text-[5rem] font-black text-black dark:text-white leading-[0.85] tracking-[-0.05em] max-w-5xl">
            {title}
          </h1>
        </div>
        
        {/* Abstract Glow */}
        <div className="absolute -bottom-44 -right-44 w-[600px] h-[600px] bg-[#0071e3] rounded-full blur-[150px] opacity-10 dark:opacity-5 pointer-events-none" />
      </section>

      {/* Feature Split Band */}
      <section className="w-full bg-white dark:bg-[#000000] py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 lg:gap-44">
          <div className="space-y-10">
            <h3 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em]">Description</h3>
            <p className="text-2xl md:text-3xl font-medium text-black break-all dark:text-white leading-relaxed tracking-tight whitespace-pre-wrap">
              {description}
            </p>
          </div>

          <div className="flex flex-col justify-between py-2 border-l border-gray-100 dark:border-[#1d1d1f] pl-12 lg:pl-20">
            <div>
              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</span>
                  <span className="text-xl font-bold text-black dark:text-white">{[city, country].filter(Boolean).join(", ") || "Global Network"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Platform</span>
                  <span className="text-xl font-bold text-black dark:text-white">{platformInfo.label || "Direct Link"}</span>
                </div>
              </div>
            </div>

            <div className="mt-20">
              <a
                href={meeting_link}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-6 bg-[#0071e3] text-white px-12 py-6 rounded-full font-bold text-lg hover:brightness-110 transition-all shadow-2xl shadow-[#0071e3]/30 cursor-pointer"
              >
                Connect now
                <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
            </div>
          </div>
        </div>
      </section>


    </div>
  );
}
