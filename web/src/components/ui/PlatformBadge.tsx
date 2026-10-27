import type { PlatformKey } from "@urconnections/shared";
import { getPlatform } from "../../lib/platforms";
import { cx } from "./cx";

const SIZES = {
  sm: "px-3 py-1 gap-1",
  md: "px-4 py-1.5 gap-2",
} as const;

interface PlatformBadgeProps {
  platform: PlatformKey;
  size?: keyof typeof SIZES;
  /** E.g. "min-w-0" inside a one-line flex row: the label then truncates ("Microsoft Te…"). */
  className?: string;
}

/** "WhatsApp" pill with the platform's icon and colors (audit D8). */
export function PlatformBadge({ platform, size = "sm", className }: PlatformBadgeProps) {
  const { icon: Icon, label, color } = getPlatform(platform);
  return (
    <span className={cx("inline-flex items-center rounded-full border text-[11px] font-bold", SIZES[size], color, className)}>
      <Icon aria-hidden className="shrink-0 text-sm" />
      <span className="truncate" title={label}>
        {label}
      </span>
    </span>
  );
}
