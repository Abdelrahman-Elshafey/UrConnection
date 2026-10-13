import type { ReactNode } from "react";
import { FiChevronLeft } from "react-icons/fi";
import { Link } from "react-router";
import { cx } from "./cx";

/** The "‹ Back to Explore" link at the top of a page (audit D2). */
export function BackLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link
      to={to}
      className={cx("group inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-black dark:hover:text-white", className)}
    >
      <FiChevronLeft aria-hidden className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{children}</span>
    </Link>
  );
}
