import { pageTitle } from "../../lib/pageTitle";
import { ButtonLink } from "./Button";

/** The "Not Found" page body: unknown groups, and pages you may not open. */
export function NotFound({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white p-20 dark:bg-black">
      <title>{pageTitle("Not found")}</title>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-black tracking-tighter text-black dark:text-white">Not Found</h1>
        {message && <p className="mb-6 text-gray-500 dark:text-gray-400">{message}</p>}
        <ButtonLink to="/" variant="dark" size="sm">
          Return Home
        </ButtonLink>
      </div>
    </div>
  );
}
