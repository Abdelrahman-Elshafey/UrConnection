import { cx } from "./cx";

const VARIANTS = {
  primary: "bg-accent text-white shadow-lg shadow-accent/20 hover:brightness-110",
  dark: "bg-black text-white dark:bg-white dark:text-black hover:opacity-80",
  outline: "border-2 border-gray-200 dark:border-white/10 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-white/5",
  danger:
    "border-2 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10",
} as const;

const SIZES = {
  xs: "px-4 py-2 text-xs",
  sm: "px-6 py-3 text-sm",
  md: "px-8 py-4 text-sm",
  lg: "px-10 py-5 text-lg",
  xl: "px-12 py-7 text-2xl font-black",
} as const;

export interface ButtonStyle {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /** Full width. */
  block?: boolean;
}

/** The class string for a button-looking element (used by Button and ButtonLink). In its own file
 * because a .tsx file should export only components (React fast refresh). */
export function buttonClass({ variant = "primary", size = "md", block = false }: ButtonStyle = {}, className?: string): string {
  return cx(
    "inline-flex items-center justify-center gap-3 rounded-full font-bold transition active:scale-95",
    "disabled:pointer-events-none disabled:opacity-40",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className,
  );
}
