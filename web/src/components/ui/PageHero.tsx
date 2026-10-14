import type { ReactNode } from "react";
import { cx } from "./cx";

interface PageHeroProps {
  /** First line, black/white. */
  lead: string;
  /** Second line, in the accent color. */
  accent: string;
  intro?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

/** The huge two-line headline ("Your / Profile.") at the top of the main pages (audit D12). */
export function PageHero({ lead, accent, intro, align = "left", className }: PageHeroProps) {
  const centered = align === "center";
  return (
    <div className={cx(centered && "flex flex-col items-center text-center", className)}>
      <h1 className="mb-8 flex flex-col text-6xl font-black leading-[0.85] tracking-tighter text-black dark:text-white md:text-8xl lg:text-9xl">
        <span>{lead}</span>
        <span className="text-accent">{accent}</span>
      </h1>
      {intro && <p className="max-w-2xl text-xl font-medium leading-relaxed text-gray-500 dark:text-gray-400 md:text-2xl">{intro}</p>}
    </div>
  );
}
