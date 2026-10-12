import { Link } from "react-router-dom";

/** The centered, minimal layout shared by the small auth pages (verify, forgot, reset). */
export default function AuthCard({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] flex flex-col justify-center py-20 px-6">
      <div className="max-w-md w-full mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-12 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <span aria-hidden="true">←</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Return to Explore</span>
        </Link>
        <h1 className="text-5xl font-black text-black dark:text-white tracking-tighter leading-[0.9] mb-4">{title}</h1>
        {subtitle && <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-10">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

/** A green or red notice box. */
export function Notice({ tone = "info", children }) {
  const styles =
    tone === "error"
      ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"
      : "bg-[#0071e3]/5 border-[#0071e3]/20 text-[#0071e3]";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`mb-8 p-4 border rounded-2xl text-center ${styles}`}>
      <p className="text-sm font-bold">{children}</p>
    </div>
  );
}

export const inputClass =
  "w-full bg-[#f5f5f7] dark:bg-[#111111] px-6 py-5 rounded-2xl outline-none text-lg font-bold transition-all border-2 border-transparent focus:border-[#0071e3] text-black dark:text-white placeholder-gray-300 dark:placeholder-gray-700";

export const buttonClass =
  "w-full bg-[#0071e3] text-white font-bold py-5 rounded-2xl text-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer";
