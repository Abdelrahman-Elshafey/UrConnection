import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "../../auth/hooks/useUser";
import { useGetUserGroups } from "../../groups/hooks/useGetUserGroups";
import { signOut } from "../../../services/auth.service";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import GroupCard from "../../groups/components/GroupCard";
import ProfileAvatar from "./ProfileAvatar";
import { useNavigate } from "react-router-dom";
import { COUNTRIES_CITIES, COUNTRY_LIST } from "../../../lib/countries";

/* ─── Validation schema for the edit form ─── */
const profileSchema = z.object({
  displayName: z.string().max(100, "Name is too long.").optional().or(z.literal("")),
  phoneNumber: z.string().max(30, "Phone number is too long.").optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
});

/* ─── Reusable input class string ─── */
const INPUT_CLS =
  "w-full bg-white dark:bg-[#0a0a0a] px-6 py-4 rounded-2xl outline-none text-base font-bold transition-all border-2 border-transparent focus:border-[#0071e3] text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-600";

const SELECT_CLS =
  "w-full bg-white dark:bg-[#0a0a0a] px-6 py-4 rounded-2xl outline-none text-base font-bold transition-all border-2 border-transparent focus:border-[#0071e3] text-black dark:text-white appearance-none cursor-pointer";

export default function ProfilePage() {
  const { data: session, isLoading: isUserLoading } = useUser();
  const user = session?.user;
  const navigate = useNavigate();

  const { data: groups, isLoading: isGroupsLoading } = useGetUserGroups(user?.id);
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

  /* ─── Edit mode state ─── */
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      phoneNumber: "",
      country: "",
      city: "",
    },
  });

  const selectedCountry = watch("country");

  /* ─── Sync form defaults when user data arrives or edit mode opens ─── */
  const populateForm = useCallback(() => {
    if (!user) return;
    reset({
      displayName: user?.user_metadata?.display_name || "",
      phoneNumber: user?.user_metadata?.phone_number || "",
      country: user?.user_metadata?.country || "",
      city: user?.user_metadata?.city || "",
    });
  }, [user, reset]);

  useEffect(() => {
    if (isEditing) populateForm();
  }, [isEditing, populateForm]);

  /* ─── Reset city when country changes (only in edit mode) ─── */
  useEffect(() => {
    if (!isEditing) return;
    const cities = COUNTRIES_CITIES[selectedCountry] || [];
    const currentCity = watch("city");
    if (currentCity && !cities.includes(currentCity)) {
      setValue("city", "", { shouldDirty: true });
    }
  }, [selectedCountry, isEditing, setValue, watch]);

  /* ─── Handlers ─── */
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
    populateForm();
  };

  const onSubmit = (data) => {
    setSaveError(null);
    setSaveSuccess(false);
    updateProfile(
      {
        displayName: data.displayName || null,
        phoneNumber: data.phoneNumber || null,
        country: data.country || null,
        city: data.city || null,
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setIsEditing(false);
          setTimeout(() => setSaveSuccess(false), 3000);
        },
        onError: (err) => {
          setSaveError(err.message || "Failed to update profile.");
        },
      },
    );
  };

  /* ─── Loading state ─── */
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#000000]">
        <div className="w-12 h-12 border-4 border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin" />
      </div>
    );
  }

  const availableCities = COUNTRIES_CITIES[selectedCountry] || [];

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] py-10 px-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-black dark:text-white tracking-tighter leading-[0.85] mb-6">
            Your <br /><span className="text-[#0071e3]">Profile.</span>
          </h1>
          <p className="text-sm md:text-lg text-gray-500 dark:text-gray-400 font-medium max-w-xl">
            Manage your account details and view the communities you've launched.
          </p>
        </div>

        {/* ── Success Toast ── */}
        <div
          className={`fixed top-6 right-6 z-50 transition-all duration-500 ${
            saveSuccess
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="bg-black dark:bg-white text-white dark:text-black px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400 dark:text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-bold">Profile updated successfully.</span>
          </div>
        </div>

        {/* ── Account Information Section ── */}
        <section className="mb-24 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] mb-4">
              Account Information
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
              Your personal details and contact information. Manage how you appear to others.
            </p>
          </div>

          <div className="lg:col-span-2 bg-[#f5f5f7] dark:bg-[#111111] rounded-[40px] p-10 md:p-16 space-y-10">
            {/* Profile Avatar */}
            <div className="flex justify-center pb-6 border-b border-gray-200 dark:border-white/5">
              <ProfileAvatar user={user} />
            </div>

            {/* ── Error Message ── */}
            {saveError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl text-center animate-fade-in">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 tracking-wide">
                  {saveError}
                </p>
              </div>
            )}

            {isEditing ? (
              /* ════════════════════════════════════
                 EDIT MODE
                 ════════════════════════════════════ */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in">
                {/* Email — read-only */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    Email Address
                  </label>
                  <div className="w-full bg-gray-200/60 dark:bg-[#1a1a1a] px-6 py-4 rounded-2xl text-base font-bold text-gray-400 dark:text-gray-600 cursor-not-allowed select-none">
                    {user?.email}
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-600 ml-1 font-medium">
                    Email cannot be changed from here.
                  </p>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    {...register("displayName")}
                    className={INPUT_CLS}
                  />
                  {errors.displayName && (
                    <p className="text-red-500 text-xs font-bold ml-1">{errors.displayName.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 234 567 8900"
                    {...register("phoneNumber")}
                    className={INPUT_CLS}
                  />
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-xs font-bold ml-1">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Country & City — linked dropdowns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      Country
                    </label>
                    <div className="relative">
                      <select {...register("country")} className={SELECT_CLS}>
                        <option value="">Select country</option>
                        {COUNTRY_LIST.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      {/* Chevron icon */}
                      <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                      City
                    </label>
                    <div className="relative">
                      <select
                        {...register("city")}
                        disabled={!selectedCountry}
                        className={`${SELECT_CLS} ${!selectedCountry ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <option value="">
                          {selectedCountry ? "Select city" : "Select a country first"}
                        </option>
                        {availableCities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200 dark:border-white/5 flex flex-wrap gap-4">
                  <button
                    type="submit"
                    disabled={isSaving || !isDirty}
                    className="bg-[#0071e3] text-white px-10 py-4 rounded-full font-bold text-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 flex items-center gap-3 cursor-pointer shadow-lg shadow-[#0071e3]/20"
                  >
                    {isSaving && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {isSaving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="bg-transparent border-2 border-gray-200 dark:border-white/10 text-black dark:text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* ════════════════════════════════════
                 READ MODE
                 ════════════════════════════════════ */
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Display Name</p>
                    <p className="text-xl font-bold text-black dark:text-white">
                      {user?.user_metadata?.display_name || "Not set"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email Address</p>
                    <p className="text-xl font-bold text-black dark:text-white">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Phone Number</p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {user?.user_metadata?.phone_number || "Not set"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</p>
                    <p className="text-2xl font-bold text-black dark:text-white">
                      {[user?.user_metadata?.city, user?.user_metadata?.country].filter(Boolean).join(", ") || "Not set"}
                    </p>
                  </div>
                </div>
                <div className="pt-6 mt-10 border-t border-gray-200 dark:border-white/5 flex flex-wrap gap-4">
                  <button
                    onClick={() => {
                      setSaveError(null);
                      setIsEditing(true);
                    }}
                    className="bg-[#0071e3] text-white px-8 py-4 rounded-full font-bold text-sm hover:brightness-110 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#0071e3]/20 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-full font-bold text-sm hover:opacity-80 transition-all active:scale-95 cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── User Groups Section ── */}
        <section>
          <div className="mb-12">
            <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.5em] mb-4">
              Your Groups
            </h2>
            <h3 className="text-4xl md:text-5xl font-black text-black dark:text-white tracking-tighter">
              Communities you lead.
            </h3>
          </div>

          {isGroupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#f5f5f7] dark:bg-[#111111] rounded-[32px] h-[400px] animate-pulse" />
              ))}
            </div>
          ) : groups?.length > 0 ? (
            <div className="grid grid-cols-1 mx-4 md:grid-cols-2 place-items-center lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="bg-[#f5f5f7] dark:bg-[#111111] rounded-[40px] p-20 text-center">
              <p className="text-2xl font-bold text-gray-400 dark:text-gray-600 mb-8">You haven't created any groups yet.</p>
              <button
                onClick={() => navigate("/create")}
                className="bg-[#0071e3] text-white px-10 py-5 rounded-full font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#0071e3]/20 cursor-pointer"
              >
                Launch your first channel
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
