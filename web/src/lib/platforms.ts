import type { IconType } from "react-icons";
import {
  FaDiscord,
  FaFacebook,
  FaFacebookMessenger,
  FaInstagram,
  FaLinkedin,
  FaMeetup,
  FaMicrosoft,
  FaPinterest,
  FaReddit,
  FaSkype,
  FaSlack,
  FaSquareSnapchat,
  FaTelegram,
  FaTiktok,
  FaTwitch,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { SiGooglemeet, SiSignal, SiThreads, SiZoom } from "react-icons/si";
import { PLATFORMS as PLATFORM_META, type Platform, type PlatformKey } from "@urconnections/shared";

interface PlatformUi {
  icon: IconType;
  /** Tailwind classes for the badge (background, text, border; light + dark). */
  color: string;
}

/** A platform as the UI needs it: shared metadata + icon and colors. */
export type PlatformView = Platform & PlatformUi;

const GRAY = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700";

// Record<PlatformKey, ...> forces an entry for every platform in @urconnections/shared:
// adding a platform there without an icon here is a compile error.
// Class strings are written out in full on purpose: Tailwind only generates CSS
// for class names it can find literally in the source.
const PLATFORM_UI: Record<PlatformKey, PlatformUi> = {
  whatsapp: {
    icon: FaWhatsapp,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  },
  telegram: {
    icon: FaTelegram,
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  discord: {
    icon: FaDiscord,
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  },
  zoom: {
    icon: SiZoom,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  google_meet: {
    icon: SiGooglemeet,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  },
  facebook: {
    icon: FaFacebook,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  messenger: {
    icon: FaFacebookMessenger,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  instagram: {
    icon: FaInstagram,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  },
  reddit: {
    icon: FaReddit,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  },
  slack: {
    icon: FaSlack,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  teams: {
    icon: FaMicrosoft,
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  },
  skype: {
    icon: FaSkype,
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  signal: {
    icon: SiSignal,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  linkedin: {
    icon: FaLinkedin,
    color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 border-sky-200 dark:border-sky-800",
  },
  meetup: {
    icon: FaMeetup,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  twitter: {
    icon: FaXTwitter,
    color: GRAY,
  },
  tiktok: {
    icon: FaTiktok,
    color: GRAY,
  },
  youtube: {
    icon: FaYoutube,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  twitch: {
    icon: FaTwitch,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
  snapchat: {
    icon: FaSquareSnapchat,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  },
  pinterest: {
    icon: FaPinterest,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  threads: {
    icon: SiThreads,
    color: GRAY,
  },
};

export const PLATFORMS: readonly PlatformView[] = PLATFORM_META.map((p) => ({ ...p, ...PLATFORM_UI[p.key] }));

const PLATFORM_VIEWS = Object.fromEntries(PLATFORMS.map((p) => [p.key, p])) as Record<PlatformKey, PlatformView>;

/**
 * UI info for a platform. Every stored group has a valid key (the database CHECK and the
 * response schema guarantee it), so there's no "unknown platform" fallback.
 */
export const getPlatform = (key: PlatformKey): PlatformView => PLATFORM_VIEWS[key];
