import { isRouteErrorResponse, useRouteError } from "react-router";
import { pageTitle } from "../../lib/pageTitle";
import { isChunkLoadError } from "../../lib/routeErrors";
import { Button, ButtonLink } from "../ui/Button";
import { NotFound } from "../ui/NotFound";

/**
 * The router's errorElement (audit R4). React Router shows it instead of the page when a
 * loader throws, a lazy page fails to download, or a component crashes while rendering.
 * Without it, any of those would leave a blank white screen.
 */
export default function RouteError() {
  const error = useRouteError();

  // A thrown 404 Response (e.g. from a loader) gets the normal "Not Found" page.
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound message="There's no page at this address." />;

  const outdated = isChunkLoadError(error);
  if (import.meta.env.DEV) console.error(error); // the details, for the developer only

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white p-10 dark:bg-black">
      <title>{pageTitle(outdated ? "Update available" : "Something went wrong")}</title>
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-black tracking-tighter text-black dark:text-white">
          {outdated ? "A new version is available" : "Something went wrong"}
        </h1>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
          {outdated
            ? "The site was updated while this page was open. Reload to get the latest version."
            : "This page hit an unexpected error. Reloading usually helps; if it doesn't, go back home."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
          <ButtonLink to="/" variant="dark" size="sm" reloadDocument>
            Return Home
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
