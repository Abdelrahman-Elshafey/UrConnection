import { useT } from "../../i18n/i18n";
import { pageTitle } from "../../lib/pageTitle";
import { ButtonLink } from "./Button";

/** The "Not Found" page body: unknown groups, and pages you may not open. */
export function NotFound({ message }: { message?: string }) {
  const { t } = useT();
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white p-20 dark:bg-black">
      <title>{pageTitle(t("notFound.pageTitle"))}</title>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-black tracking-tighter text-black dark:text-white">{t("notFound.heading")}</h1>
        {message && <p className="mb-6 text-gray-500 dark:text-gray-400">{message}</p>}
        <ButtonLink to="/" variant="dark" size="sm">
          {t("common.returnHome")}
        </ButtonLink>
      </div>
    </div>
  );
}

/**
 * "There's no page at this address": for unknown URLs. Its own component because the router
 * table in App.tsx is built outside React, where the useT() hook can't run.
 */
export function PageNotFound() {
  const { t } = useT();
  return <NotFound message={t("notFound.noPage")} />;
}
