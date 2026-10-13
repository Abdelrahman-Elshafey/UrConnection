import { Outlet, ScrollRestoration } from "react-router";

export default function RootLayout() {
  return (
    <>
      {/* Built into React Router's data router: new pages start at the top, and the
          Back button returns to where you were scrolled (a hand-made scrollTo can't). */}
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
