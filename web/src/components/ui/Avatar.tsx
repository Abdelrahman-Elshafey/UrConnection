import type { User } from "@urconnections/shared";
import { initialOf } from "../../lib/format";
import { cx } from "./cx";

const SIZES = {
  sm: { box: "h-7 w-7", text: "text-[11px]" },
  lg: { box: "h-32 w-32 md:h-40 md:w-40", text: "text-5xl md:text-6xl" },
} as const;

interface AvatarProps {
  user: Pick<User, "avatar_url" | "display_name" | "email">;
  size?: keyof typeof SIZES;
  className?: string;
}

/** The user's picture, or their initial on the accent color (audit D6). */
export function Avatar({ user, size = "sm", className }: AvatarProps) {
  const { box, text } = SIZES[size];
  return (
    <span className={cx("inline-flex shrink-0 overflow-hidden rounded-full", box, className)}>
      {user.avatar_url ? (
        // alt="": the name is always shown next to the picture, so it would only be read twice.
        <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span aria-hidden className={cx("flex h-full w-full select-none items-center justify-center bg-accent font-black text-white", text)}>
          {initialOf(user)}
        </span>
      )}
    </span>
  );
}
