import { cx } from "./cx";

const SIZES = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-[3px]",
  lg: "w-12 h-12 border-[3px]",
} as const;

const TONES = {
  accent: "border-accent/20 border-t-accent",
  // currentColor follows the text color, so it works on any button background.
  current: "border-current/25 border-t-current",
} as const;

interface SpinnerProps {
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  className?: string;
}

/** A spinning ring (audit D1). role="status" + a label tell screen readers something is loading. */
export function Spinner({ size = "md", tone = "accent", className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx("inline-block shrink-0 rounded-full animate-spin", SIZES[size], TONES[tone], className)}
    />
  );
}

/** A whole-page loading state, optionally with a caption. */
export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center gap-6">
        <Spinner size="lg" />
        {label && <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{label}</p>}
      </div>
    </div>
  );
}
