import type { ReactNode } from "react";
import { cx } from "./cx";

const TONES = {
  info: "bg-accent/5 border-accent/20 text-accent",
  error: "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400",
} as const;

interface NoticeProps {
  tone?: keyof typeof TONES;
  className?: string;
  children: ReactNode;
}

/**
 * A message box. Errors use role="alert" (read out at once), other notices role="status"
 * (read out politely, when the screen reader is idle).
 */
export function Notice({ tone = "info", className, children }: NoticeProps) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded-2xl border p-4 text-center", TONES[tone], className)}>
      <p className="text-sm font-bold">{children}</p>
    </div>
  );
}
