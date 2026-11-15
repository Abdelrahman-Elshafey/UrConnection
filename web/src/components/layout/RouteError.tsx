import { isRouteErrorResponse, useRouteError } from "react-router";
import { useT } from "../../i18n/i18n";
import { pageTitle } from "../../lib/pageTitle";
import { isChunkLoadError } from "../../lib/routeErrors";
import { Button, ButtonLink } from "../ui/Button";
import { PageNotFound } from "../ui/NotFound";

/**
 * The router's errorElement (audit R4). React Router shows it instead of the page when a
 * loader throws, a lazy page fails to download, or a component crashes while rendering.
 * Without it, any of those would leave a blank white screen.
 */
export default function RouteError() {
  const error = useRouteError();
  const { t } = useT();

  // A thrown 404 Response (e.g. from a loader) gets the normal "Not Found" page.
  if (isRouteErrorResponse(error) && error.status === 404) return <PageNotFound />;

  const outdated = isChunkLoadError(error);
  if (import.meta.env.DEV) console.error(error); // the details, for the developer only

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white p-10 dark:bg-black">
      <title>{pageTitle(t(outdated ? "routeError.updateTitle" : "routeError.errorTitle"))}</title>
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-4xl font-black tracking-tighter text-black dark:text-white">
          {t(outdated ? "routeError.updateHeading" : "routeError.errorHeading")}
        </h1>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
          {t(outdated ? "routeError.updateBody" : "routeError.errorBody")}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button size="sm" onClick={() => window.location.reload()}>
            {t("routeError.reload")}
          </Button>
          <ButtonLink to="/" variant="dark" size="sm" reloadDocument>
            {t("common.returnHome")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
