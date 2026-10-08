import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import MainLayout from "./GenealComponents/MainLayout";
import GroupList from "./features/groups/components/GroupList";
import CreateGroupForm from "./features/groups/components/CreateGroupForm";
import GroupDetail from "./features/groups/components/GroupDetail";
import AuthPage from "./features/auth/components/AuthPage";
import ProfilePage from "./features/profile/components/ProfilePage";
import RootLayout from "./GenealComponents/RootLayout";
import { Analytics } from "@vercel/analytics/react";
import { queryClient } from "./lib/queryClient";
import { sessionQueryOptions } from "./features/auth/hooks/useUser";

// Read through the ['session'] cache so loaders and components agree on auth state.
const getCachedSession = () => queryClient.ensureQueryData(sessionQueryOptions);

const requireAuth = async () => {
  const session = await getCachedSession();
  if (!session) {
    return redirect("/login");
  }
  return null;
};

const redirectIfAuth = async () => {
  const session = await getCachedSession();
  if (session) {
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
