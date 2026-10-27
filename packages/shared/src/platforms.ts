// Meeting platforms: everything that is NOT UI (icons/colors live in web/src/lib/platforms.ts).
// createGroupSchema checks each meeting link against its platform's linkPattern, in the form and in the API.

export const PLATFORMS = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    linkPattern: /^https?:\/\/(www\.)?(wa\.me|chat\.whatsapp\.com|api\.whatsapp\.com)(\/.*)?$/i,
    placeholder: "https://chat.whatsapp.com/...",
  },
  {
    key: "telegram",
    label: "Telegram",
    linkPattern: /^https?:\/\/(www\.)?(t\.me|telegram\.me)(\/.*)?$/i,
    placeholder: "https://t.me/...",
  },
  {
    key: "discord",
    label: "Discord",
    linkPattern: /^https?:\/\/(www\.)?(discord\.gg|discord\.com|discordapp\.com)(\/.*)?$/i,
    placeholder: "https://discord.gg/...",
  },
  {
    key: "zoom",
    label: "Zoom",
    linkPattern: /^https?:\/\/(www\.)?(zoom\.us|us\d+\.web\.zoom\.us)(\/.*)?$/i,
    placeholder: "https://zoom.us/j/...",
  },
  {
    key: "google_meet",
    label: "Google Meet",
    linkPattern: /^https?:\/\/(www\.)?(meet\.google\.com)(\/.*)?$/i,
    placeholder: "https://meet.google.com/...",
  },
  {
    key: "facebook",
    label: "Facebook",
    linkPattern: /^https?:\/\/(www\.)?(facebook\.com|fb\.com|fb\.me|m\.facebook\.com)(\/.*)?$/i,
    placeholder: "https://facebook.com/groups/...",
  },
  {
    key: "messenger",
    label: "Messenger",
    linkPattern: /^https?:\/\/(www\.)?(messenger\.com|m\.me)(\/.*)?$/i,
    placeholder: "https://m.me/...",
  },
  {
    key: "instagram",
    label: "Instagram",
    linkPattern: /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)(\/.*)?$/i,
    placeholder: "https://instagram.com/...",
  },
  {
    key: "reddit",
    label: "Reddit",
    linkPattern: /^https?:\/\/(www\.)?(reddit\.com|old\.reddit\.com)(\/.*)?$/i,
    placeholder: "https://reddit.com/r/...",
  },
  {
    key: "slack",
    label: "Slack",
    linkPattern: /^https?:\/\/(www\.)?([a-z0-9-]+\.)?slack\.com(\/.*)?$/i,
    placeholder: "https://yourworkspace.slack.com/...",
  },
  {
    key: "teams",
    label: "Microsoft Teams",
    linkPattern: /^https?:\/\/(www\.)?(teams\.microsoft\.com|teams\.live\.com)(\/.*)?$/i,
    placeholder: "https://teams.microsoft.com/...",
  },
  {
    key: "skype",
    label: "Skype",
    linkPattern: /^https?:\/\/(www\.)?(skype\.com|join\.skype\.com)(\/.*)?$/i,
    placeholder: "https://join.skype.com/...",
  },
  {
    key: "signal",
    label: "Signal",
    linkPattern: /^https?:\/\/(www\.)?(signal\.group|signal\.me)(\/.*)?$/i,
    placeholder: "https://signal.group/...",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    linkPattern: /^https?:\/\/(www\.)?(linkedin\.com)(\/.*)?$/i,
    placeholder: "https://linkedin.com/groups/...",
  },
  {
    key: "meetup",
    label: "Meetup",
    linkPattern: /^https?:\/\/(www\.)?(meetup\.com)(\/.*)?$/i,
    placeholder: "https://meetup.com/...",
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    linkPattern: /^https?:\/\/(www\.)?(twitter\.com|x\.com)(\/.*)?$/i,
    placeholder: "https://x.com/...",
  },
  {
    key: "tiktok",
    label: "TikTok",
    linkPattern: /^https?:\/\/(www\.)?(tiktok\.com)(\/.*)?$/i,
    placeholder: "https://tiktok.com/@...",
  },
  {
    key: "youtube",
    label: "YouTube",
    linkPattern: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)(\/.*)?$/i,
    placeholder: "https://youtube.com/...",
  },
  {
    key: "twitch",
    label: "Twitch",
    linkPattern: /^https?:\/\/(www\.)?(twitch\.tv)(\/.*)?$/i,
    placeholder: "https://twitch.tv/...",
  },
  {
    key: "snapchat",
    label: "Snapchat",
    linkPattern: /^https?:\/\/(www\.)?(snapchat\.com|story\.snapchat\.com)(\/.*)?$/i,
    placeholder: "https://snapchat.com/add/...",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    linkPattern: /^https?:\/\/(www\.)?(pinterest\.com|pin\.it)(\/.*)?$/i,
    placeholder: "https://pinterest.com/...",
  },
  {
    key: "threads",
    label: "Threads",
    linkPattern: /^https?:\/\/(www\.)?(threads\.net)(\/.*)?$/i,
    placeholder: "https://threads.net/@...",
  },
] as const;

export type Platform = (typeof PLATFORMS)[number];
export type PlatformKey = Platform["key"];

/** Tuple of all keys, e.g. for z.enum(PLATFORM_KEYS). */
export const PLATFORM_KEYS = PLATFORMS.map((p) => p.key) as [PlatformKey, ...PlatformKey[]];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.key, p])) as Record<PlatformKey, Platform>;

export const isPlatformKey = (value: string): value is PlatformKey => Object.hasOwn(PLATFORM_MAP, value);
