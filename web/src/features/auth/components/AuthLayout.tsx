import type { ReactNode } from "react";
import { BackLink } from "../../../components/ui/BackLink";
import { pageTitle } from "../../../lib/pageTitle";

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  /** Browser tab title, when it should differ from the headline ("Sign in" vs "Welcome back."). */
  tabTitle?: string;
  children: ReactNode;
}

/** The centered, minimal layout of every account page: login, sign-up, verify, forgot, reset. */
export default function AuthLayout({ title, subtitle, tabTitle, children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-white px-6 py-20 dark:bg-black">
      <title>{pageTitle(tabTitle ?? title)}</title>
      <div className="mx-auto w-full max-w-md">
        <BackLink to="/" className="mb-12">
          Return to Explore
        </BackLink>
        <h1 className="mb-4 text-5xl font-black leading-[0.9] tracking-tighter text-black dark:text-white md:text-6xl">{title}</h1>
        {subtitle && <p className="mb-10 text-lg font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
