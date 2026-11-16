import { Outlet, ScrollRestoration, useNavigation } from "react-router";
import { useT } from "../../i18n/i18n";

export default function RootLayout() {
  // "loading" while the next page's code (lazy routes) or its loader data is on its way.
  // The current page stays on screen meanwhile, so show that the click was received.
  const navigating = useNavigation().state !== "idle";
  const { t } = useT();

  return (
    <>
      {/* Built into React Router's data router: new pages start at the top, and the
          Back button returns to where you were scrolled (a hand-made scrollTo can't). */}
      <ScrollRestoration />
      {navigating && (
        // Starts invisible and fades in after 150ms (nav-progress in index.css): fast
        // navigations, such as changing a filter, finish before it ever shows.
        <div role="progressbar" aria-label={t("nav.loadingPage")} className="nav-progress fixed inset-x-0 top-0 z-60 h-0.5 bg-accent" />
      )}
      <Outlet />
    </>
  );
}
