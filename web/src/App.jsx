import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import MainLayout from "./GenealComponents/MainLayout";
import GroupList from "./features/groups/components/GroupList";
import CreateGroupForm from "./features/groups/components/CreateGroupForm";
import GroupDetail from "./features/groups/components/GroupDetail";
import EditGroupPage from "./features/groups/components/EditGroupPage";
import AuthPage from "./features/auth/components/AuthPage";
import VerifyEmailPage from "./features/auth/components/VerifyEmailPage";
import ForgotPasswordPage from "./features/auth/components/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/components/ResetPasswordPage";
import ProfilePage from "./features/profile/components/ProfilePage";
import RootLayout from "./GenealComponents/RootLayout";
import { Analytics } from "@vercel/analytics/react";
import { queryClient } from "./lib/queryClient";
import { sessionQueryOptions } from "./features/auth/hooks/useUser";

// Who is signed in? Read through the ['session'] cache (GET /api/auth/me once, then
// cached), so route guards and components always agree. Resolves to a User or null.
const getCurrentUser = () => queryClient.ensureQueryData(sessionQueryOptions);

const requireAuth = async () => {
  const user = await getCurrentUser();
  if (!user) {
    return redirect("/login");
  }
  return null;
};

const redirectIfAuth = async () => {
  const user = await getCurrentUser();
  if (user) {
    return redirect("/");
  }
  return null;
};

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <GroupList />,
          },
          {
            path: "groups/:groupId",
            element: <GroupDetail />,
          },
          {
            path: "groups/:groupId/edit",
            element: <EditGroupPage />,
            loader: requireAuth,
          },
          {
            path: "create",
            element: <CreateGroupForm />,
            loader: requireAuth,
          },
          {
            path: "profile",
            element: <ProfilePage />,
            loader: requireAuth,
          },
        ],
      },
      {
        path: "login",
        element: <AuthPage />,
        loader: redirectIfAuth,
      },
      // Email-link pages: public, because the link may be opened in another browser.
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Analytics />
    </>
  );
}

export default App;
