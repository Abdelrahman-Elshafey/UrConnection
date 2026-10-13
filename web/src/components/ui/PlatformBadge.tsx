import { getPlatform } from "../../lib/platforms";
import { cx } from "./cx";

const SIZES = {
  sm: "px-3 py-1 gap-1",
  md: "px-4 py-1.5 gap-2",
} as const;

/** "WhatsApp" pill with the platform's icon and colors (audit D8). */
export function PlatformBadge({ platform, size = "sm" }: { platform: string; size?: keyof typeof SIZES }) {
  const { icon: Icon, label, color } = getPlatform(platform);
  return (
    <span className={cx("inline-flex items-center rounded-full border text-[11px] font-bold", SIZES[size], color)}>
      <Icon aria-hidden className="text-sm" />
      {label}
    </span>
  );
}
