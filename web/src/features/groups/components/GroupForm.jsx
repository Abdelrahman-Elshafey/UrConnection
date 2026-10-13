import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { PLATFORMS, getPlatform } from "../../../lib/platforms";
import { pageTitle } from "../../../lib/pageTitle";
import { COUNTRY_LIST, TOPICS, createGroupSchema, getCities, updateGroupSchema } from "@urconnections/shared";

// Edit mode validates only the editable fields, all required (the form always sends all five).
const editFormSchema = updateGroupSchema.required();

const EMPTY = { title: "", topic: "", platform: "", description: "", meeting_link: "", country: "", city: "" };

const TEXT = {
  create: {
    title: "Create a group",
    heading: ["Launch your", "Community."],
    intro: "Design a premium environment for focused growth and meaningful connections.",
    submit: "Launch Channel",
  },
  edit: {
    title: "Edit group",
    heading: ["Edit your", "Community."],
    intro: "Update how your group is described. The platform and link stay as they are.",
    submit: "Save Changes",
  },
};

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-red-500 text-xs font-bold ml-3">{error.message}</p>;
}

/**
 * The group form for both creating and editing.
 *   mode="create": every field, validated by createGroupSchema.
 *   mode="edit":   title, description, topic, country, city. Platform and meeting link
 *                  are shown read-only: they can't change after creation (the API refuses too).
 * `onSubmit(values)` receives only the fields the API accepts for that mode.
 */
export default function GroupForm({ mode, group, onSubmit, isPending, error, cancelTo }) {
  const isEdit = mode === "edit";
  const text = TEXT[mode];

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? editFormSchema : createGroupSchema),
    defaultValues: isEdit
      ? {
          title: group.title,
          topic: group.topic,
          description: group.description,
          country: group.country,
          city: group.city,
        }
      : EMPTY,
  });

  const [selectedCountry, selectedPlatform] = useWatch({ control, name: ["country", "platform"] });
  const availableCities = getCities(selectedCountry);
  const platformConfig = getPlatform(isEdit ? group.platform : selectedPlatform);

  // Dependent fields are cleared only when the user changes the parent field.
  const countryField = register("country", { onChange: () => setValue("city", "") });
  const platformField = isEdit ? null : register("platform", { onChange: () => setValue("meeting_link", "") });

  // `shape` lets the textarea use taller padding and rounder corners than the inputs.
  const fieldClass = (hasError, shape = "py-6 rounded-4xl") =>
    `w-full mt-2 bg-[#f5f5f7] dark:bg-[#111111] px-8 ${shape} outline-none text-xl font-bold transition-all border-2 ${
      hasError ? "border-red-500/50" : "border-transparent focus:border-[#0071e3]"
    } text-black dark:text-white`;
  const readOnlyClass =
    "w-full mt-2 bg-gray-200/60 dark:bg-[#1a1a1a] px-8 py-6 rounded-4xl text-xl font-bold text-gray-400 dark:text-gray-600 cursor-not-allowed select-none truncate";

  return (
    <div className="w-full bg-white dark:bg-[#000000] min-h-screen pt-12 pb-25 px-4 transition-colors duration-200">
      <title>{pageTitle(text.title)}</title>
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <Link
          to={cancelTo}
          className="mb-10 self-start lg:ml-20 flex items-center gap-2 group text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Cancel and Return</span>
        </Link>

        <div className="w-full max-w-5xl mb-20">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-black dark:text-white tracking-tighter leading-[0.85] mb-8">
            {text.heading[0]}<br /><span className="text-[#0071e3]">{text.heading[1]}</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 font-medium max-w-xl">{text.intro}</p>
        </div>

        {error && (
          <div className="w-full max-w-5xl mb-10 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl text-center">
            <p className="text-xs font-bold text-red-600 dark:text-red-400 tracking-wide">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
          {/* Topic selection */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Field of Interest
            </label>
            <select {...register("topic")} className={`${fieldClass(errors.topic)} appearance-none cursor-pointer`}>
              <option value="" disabled>Select Category</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <FieldError error={errors.topic} />
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
              className={`${fieldClass(errors.title)} placeholder-gray-300 dark:placeholder-gray-700`}
            />
            <FieldError error={errors.title} />
          </div>

          {/* Platform: chosen once, read-only when editing */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Meeting Platform
            </label>
            {isEdit ? (
              <div className={readOnlyClass}>{platformConfig.label}</div>
            ) : (
              <select {...platformField} className={`${fieldClass(errors.platform)} appearance-none cursor-pointer`}>
                <option value="" disabled>Select Platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            )}
            <FieldError error={errors.platform} />
          </div>

          {/* Link: chosen once, read-only when editing */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Group Link
            </label>
            {isEdit ? (
              <>
                <div className={readOnlyClass} title={group.meeting_link}>{group.meeting_link}</div>
                <p className="text-[10px] text-gray-400 dark:text-gray-600 ml-3 font-medium">
                  The link and platform can't be changed. To use another link, create a new group.
                </p>
              </>
            ) : (
              <input
                type="text"
                placeholder={selectedPlatform ? platformConfig.placeholder : "Select Platform First"}
                disabled={!selectedPlatform}
                {...register("meeting_link")}
                className={`${fieldClass(errors.meeting_link)} placeholder-gray-300 dark:placeholder-gray-700 disabled:opacity-50`}
              />
            )}
            <FieldError error={errors.meeting_link} />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Network Location
            </label>
            <select {...countryField} className={`${fieldClass(errors.country)} appearance-none cursor-pointer`}>
              <option value="" disabled>Select Country</option>
              {COUNTRY_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <FieldError error={errors.country} />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] ml-3">
              Specific City
            </label>
            <select
              disabled={!selectedCountry}
              {...register("city")}
              className={`${fieldClass(errors.city)} appearance-none cursor-pointer disabled:opacity-50`}
            >
              <option value="" disabled>{selectedCountry ? "Select City" : "Select Country First"}</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <FieldError error={errors.city} />
          </div>

          <div className="md:col-span-2 space-y-4">
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] ml-3">
              Group Description
            </label>
            <textarea
              placeholder="What is the objective of this connection?"
              {...register("description")}
              className={`${fieldClass(errors.description, "py-8 rounded-[40px]")} min-h-60 resize-none placeholder-gray-300 dark:placeholder-gray-700`}
            />
            <FieldError error={errors.description} />
          </div>

          <div className="md:col-span-2 pt-10">
            <button
              disabled={isPending}
              type="submit"
              className="w-full bg-[#0071e3] text-white font-black py-8 rounded-full text-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:grayscale disabled:opacity-50 flex items-center justify-center gap-4 cursor-pointer"
            >
              {isPending ? <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : text.submit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
