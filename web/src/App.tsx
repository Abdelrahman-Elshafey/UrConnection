import { createBrowserRouter, redirect, RouterProvider } from "react-router";
import MainLayout from "./components/layout/MainLayout";
import RootLayout from "./components/layout/RootLayout";
import { NotFound } from "./components/ui/NotFound";
import { PageSpinner } from "./components/ui/Spinner";
import ForgotPasswordPage from "./features/auth/components/ForgotPasswordPage";
import LoginPage from "./features/auth/components/LoginPage";
import ResetPasswordPage from "./features/auth/components/ResetPasswordPage";
import SignupPage from "./features/auth/components/SignupPage";
import VerifyEmailPage from "./features/auth/components/VerifyEmailPage";
import { sessionQueryOptions } from "./features/auth/hooks/useUser";
import CreateGroupPage from "./features/groups/components/CreateGroupPage";
import EditGroupPage from "./features/groups/components/EditGroupPage";
import GroupDetail from "./features/groups/components/GroupDetail";
import GroupList from "./features/groups/components/GroupList";
import ProfilePage from "./features/profile/components/ProfilePage";
import { queryClient } from "./lib/queryClient";

// Who is signed in? Read through the ['session'] cache (GET /api/auth/me once, then
// cached), so route guards and components always agree. Resolves to a User or null.
const getCurrentUser = () => queryClient.ensureQueryData(sessionQueryOptions);

/** Loader for pages that need a session: no user → /login. */
const requireAuth = async () => ((await getCurrentUser()) ? null : redirect("/login"));

/** Loader for /login and /signup: already signed in → home. */
const redirectIfAuth = async () => ((await getCurrentUser()) ? redirect("/") : null);

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    // Shown on the first page load while route loaders run (e.g. the session check
    // before /profile). Without it the screen stays empty for that moment.
    hydrateFallbackElement: <PageSpinner />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <GroupList /> },
          { path: "groups/:groupId", element: <GroupDetail /> },
          { path: "groups/:groupId/edit", element: <EditGroupPage />, loader: requireAuth },
          { path: "create", element: <CreateGroupPage />, loader: requireAuth },
          { path: "profile", element: <ProfilePage />, loader: requireAuth },
          // Any other address: a real "not found" page instead of a blank screen.
          { path: "*", element: <NotFound message="There's no page at this address." /> },
        ],
      },
      { path: "login", element: <LoginPage />, loader: redirectIfAuth },
      { path: "signup", element: <SignupPage />, loader: redirectIfAuth },
      // Email-link pages: public, because the link may be opened in another browser.
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
