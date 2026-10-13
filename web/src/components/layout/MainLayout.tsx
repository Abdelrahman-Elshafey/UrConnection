import { Outlet } from "react-router";
import VerifyEmailBanner from "../../features/auth/components/VerifyEmailBanner";
import Footer from "./Footer";
import Navbar from "./Navbar";

/** The frame around every main page: navbar, the unverified-email banner, the page, footer. */
export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-200 selection:bg-accent selection:text-white dark:bg-black">
      <Navbar />
      <VerifyEmailBanner />
      <main className="w-full flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
