import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateGroup } from "../hooks/useCreateGroup";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../auth/hooks/useUser";
import { COUNTRIES_CITIES, COUNTRY_LIST } from "../../../lib/countries";
import { groupSchema } from "../../../lib/groupSchema";
import { PLATFORMS, getPlatform } from "../../../lib/platforms";

const TOPICS = [
  "Programming",
  "Language",
  "Math",
  "Science",
  "Design",
  "Business",
  "Art",
];

export default function CreateGroupForm() {
  const navigate = useNavigate();
  const { mutate, isPending } = useCreateGroup();
  const { data: session } = useUser();
  const user = session?.user;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      title: "",
      topic: "",
      platform: "",
      description: "",
      meeting_link: "",
      country: "",
      city: "",
    },
  });

  const selectedCountry = watch("country");
  const selectedPlatform = watch("platform");
  const selectedTitle = watch("title") || "";
  const selectedDescription = watch("description") || "";
  const availableCities = selectedCountry ? COUNTRIES_CITIES[selectedCountry] : [];

  const platformConfig = selectedPlatform ? getPlatform(selectedPlatform) : null;

  useEffect(() => {
    setValue("city", "");
  }, [selectedCountry, setValue]);

  useEffect(() => {
    setValue("meeting_link", "");
  }, [selectedPlatform, setValue]);

  const onSubmit = (data) => {
    mutate(
      {
        ...data,
        user_id: user?.id,
        date: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          navigate("/");
        },
      }
    );
  };

  return (
    <div className="w-full bg-white dark:bg-[#000000] min-h-screen pt-12 pb-25 px-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <button
          onClick={() => navigate("/")}
          className="mb-10 self-start lg:ml-20 flex items-center gap-2 group text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Cancel and Return</span>
        </button>

        <div className="w-full max-w-5xl mb-20">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-black dark:text-white tracking-tighter leading-[0.85] mb-8">
            Launch your<br /><span className="text-[#0071e3]">Community.</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium max-w-xl">
            Design a premium environment for focused growth and meaningful connections.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16"
        >
          {/* Topic selection */}
          <div className="space-y-4">
            <label className="text-[11px]   font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em]  ml-3">
              Field of Interest
            </label>
            <div className="relative ">
              <select
                {...register("topic")}
                className={`w-full mt-2 bg-[#f5f5f7] dark:bg-[#111111] px-8 py-6 rounded-[32px] outline-none appearance-none text-xl font-bold transition-all border-2 cursor-pointer ${
                  errors.topic ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"
                } text-black dark:text-white`}
              >
                <option value="" disabled>Select Category</option>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              
            </div>
          </div>

          {/* Title input */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Design Collective"
              {...register("title")}
              className={`w-full mt-2 bg-[#f5f5f7] dark:bg-[#111111] px-8 py-6 rounded-[32px] outline-none text-xl font-bold transition-all border-2 ${
                errors.title ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"
              } text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700`}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Meeting Platform
            </label>
            <div className="relative">
              <select
                {...register("platform")}
                className={`w-full mt-2 bg-[#f5f5f7] dark:bg-[#111111] px-8 py-6 rounded-[32px] outline-none appearance-none text-xl font-bold transition-all border-2 cursor-pointer ${
                  errors.platform ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"
                } text-black dark:text-white`}
              >
                <option value="" disabled>Select Platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Group Link
            </label>
            <input
              type="text"
              placeholder={platformConfig ? platformConfig.placeholder : "Select Platform First"}
              disabled={!selectedPlatform}
              {...register("meeting_link")}
              className={`w-full mt-2 bg-[#f5f5f7] dark:bg-[#111111] px-8 py-6 rounded-[32px] outline-none text-xl font-bold transition-all border-2 ${
                errors.meeting_link ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"
              } text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700 disabled:opacity-50`}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Network Location
            </label>
            <div className="relative">
              <select
                {...register("country")}
                className={`w-full mt-2 bg-[#f5f5f7] dark:bg-[#111111] px-8 py-6 rounded-[32px] outline-none appearance-none text-xl font-bold transition-all border-2 cursor-pointer ${
                  errors.country ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"
                } text-black dark:text-white`}
              >
                <option value="" disabled>Select Country</option>
                {COUNTRY_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Specific City
            </label>
            <div className="relative">
              <select
                disabled={!selectedCountry}
                {...register("city")}
                className={`w-full mt-2 bg-[#f5f5f7] dark:bg-[#111111] px-8 py-6 rounded-[32px] outline-none appearance-none text-xl font-bold transition-all border-2 cursor-pointer ${
                  errors.city ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"
                } text-black dark:text-white disabled:opacity-50`}
              >
                <option value="" disabled>{selectedCountry ? "Select City" : "Select Country First"}</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] ml-3">
              Group Description
            </label>
            <textarea
              placeholder="What is the objective of this connection?"
              {...register("description")}
              className={`w-full mt-2 bg-[#f5f5f7] dark:bg-[#111111] px-8 py-8 rounded-[40px] outline-none text-xl font-bold transition-all border-2 min-h-[240px] resize-none ${
                errors.description ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"
              } text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700`}
            />
          </div>

          <div className="md:col-span-2 pt-10">
            <button
              disabled={isPending}
              type="submit"
              className="w-full bg-[#0071e3] text-white font-black py-8 rounded-full text-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-4 cursor-pointer"
            >
              {isPending ? (
                <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                "Launch Channel"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
