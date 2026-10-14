import type { ComponentType } from "react";
import { createBrowserRouter, redirect, RouterProvider, type LoaderFunctionArgs } from "react-router";
import MainLayout from "./components/layout/MainLayout";
import RootLayout from "./components/layout/RootLayout";
import RouteError from "./components/layout/RouteError";
import { NotFound } from "./components/ui/NotFound";
import { PageSpinner } from "./components/ui/Spinner";
import { sessionQueryOptions } from "./features/auth/hooks/useUser";
import GroupList from "./features/groups/components/GroupList";
import { groupDetailQuery } from "./features/groups/hooks/useGroup";
import { queryClient } from "./lib/queryClient";

// Who is signed in? Read through the ['session'] cache (GET /api/auth/me once, then
// cached), so route guards and components always agree. Resolves to a User or null.
const getCurrentUser = () => queryClient.ensureQueryData(sessionQueryOptions);

/** Loader for pages that need a session: no user → /login. */
const requireAuth = async () => ((await getCurrentUser()) ? null : redirect("/login"));

/** Loader for /login and /signup: already signed in → home. */
const redirectIfAuth = async () => ((await getCurrentUser()) ? redirect("/") : null);

/**
 * Loader for /groups/:groupId (audit R3): starts fetching the group at the same moment the
 * page's code starts downloading, instead of after it (a "waterfall"). prefetchQuery never
 * throws: a missing group is stored in the cache and the page shows its own Not Found.
 */
async function prefetchGroup({ params }: LoaderFunctionArgs) {
  if (params.groupId) await queryClient.prefetchQuery(groupDetailQuery(params.groupId));
  return null;
}

/**
 * Code splitting (audit P1/R5): `lazy` downloads a page's JavaScript the first time someone
 * opens it, so the home page no longer ships the forms, the profile page and the auth pages.
 * Vite turns every `import("./x")` into its own file (a "chunk"). The home page (GroupList)
 * stays a normal import: it's where almost every visit starts, so it should be ready at once.
 * React Router runs a route's loader and its lazy() at the same time.
 */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({ Component: (await load()).default });

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    // Shown on the first page load while route loaders and lazy pages load (e.g. the
    // session check before /profile). Without it the screen stays empty for that moment.
    hydrateFallbackElement: <PageSpinner />,
    // Last resort for errors outside the main frame (e.g. /login): a full-page error screen.
    errorElement: <RouteError />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            // Pathless route: catches errors of every page below and shows them inside
            // MainLayout, so the navbar stays and the user can navigate away (audit R4).
            errorElement: <RouteError />,
            children: [
              { index: true, element: <GroupList /> },
              { path: "groups/:groupId", loader: prefetchGroup, lazy: page(() => import("./features/groups/components/GroupDetail")) },
              { path: "groups/:groupId/edit", loader: requireAuth, lazy: page(() => import("./features/groups/components/EditGroupPage")) },
              { path: "create", loader: requireAuth, lazy: page(() => import("./features/groups/components/CreateGroupPage")) },
              { path: "profile", loader: requireAuth, lazy: page(() => import("./features/profile/components/ProfilePage")) },
              // Any other address: a real "not found" page instead of a blank screen.
              { path: "*", element: <NotFound message="There's no page at this address." /> },
            ],
          },
        ],
      },
      { path: "login", loader: redirectIfAuth, lazy: page(() => import("./features/auth/components/LoginPage")) },
      { path: "signup", loader: redirectIfAuth, lazy: page(() => import("./features/auth/components/SignupPage")) },
      // Email-link pages: public, because the link may be opened in another browser.
      { path: "verify-email", lazy: page(() => import("./features/auth/components/VerifyEmailPage")) },
      { path: "forgot-password", lazy: page(() => import("./features/auth/components/ForgotPasswordPage")) },
      { path: "reset-password", lazy: page(() => import("./features/auth/components/ResetPasswordPage")) },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
