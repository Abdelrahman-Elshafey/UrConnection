import ScrollToTop from "./ScrollToTop";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../features/auth/hooks/useUser";
import { signOut } from "../services/auth.service";

export default function MainLayout() {

  const navigate = useNavigate();
  const location = useLocation();
  const isCreatePage = location.pathname === "/create";
  const { data: session } = useUser();
  const user = session?.user;
  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.display_name || user?.email || "?";
  const initials = displayName.charAt(0).toUpperCase();
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#000000] transition-colors duration-200 flex flex-col selection:bg-[#0071e3] selection:text-white">
      {/* Adaptive Global Navigation */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-[#1d1d1f]/70 backdrop-blur-2xl border-b border-gray-100 dark:border-[#1d1d1f] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-3xl mr-4 font-extrabold text-black dark:text-white hover:opacity-70 transition-opacity tracking-tighter cursor-pointer"
          >
            UrConnections
          </Link>

          <div className="flex gap-4 items-center">
            {user ? (
              <div className="flex gap-4 items-center">
                <Link to="/profile" className="flex gap-2 items-center">
                <div className="w-6 h-6 border border-gray-300 dark:border-white/5 rounded-full overflow-hidden">
                  {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#0071e3] flex items-center justify-center">
              <span className="text-white text-contain">
                {initials}
              </span>
            </div>
          )}
                </div>
                
                </Link>
                <Link
                  to="/profile"
                  className="text-xs font-bold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors uppercase tracking-widest hidden sm:block cursor-pointer"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-bold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors uppercase tracking-widest hidden sm:block cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors uppercase tracking-widest hidden sm:block cursor-pointer"
              >
                Sign In
              </Link>
            )}

            {isCreatePage ? (
              <Link
                to="/"
                className="text-[13px] font-medium text-black dark:text-white hover:opacity-60 transition-opacity cursor-pointer"
              >
                Go Back
              </Link>
            ) : (
              <Link
                to="/create"
                className="bg-[#0071e3] text-white px-4  py-2 rounded-full lg:text-[13px] md:text-[12px] text-[8px]  font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#0071e3]/20 cursor-pointer"
              >
                Create Group
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full">
        <ScrollToTop />
        <Outlet />
      </main>

      {/* Detailed Utility Footer */}
      <footer className="w-full bg-black dark:bg-[#1d1d1f] pt-20 pb-5 px-2 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-around ">
            <div className="text-center mx-4">
              <h4 className="text-[10px] md:text-[12px] lg:text-[14px]  font-bold text-black sm:text- dark:text-white mb-6 uppercase tracking-widest">
                Explore
              </h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/"
                    className="text-[10px] md:text-[12px] lg:text-[14px] text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    All Groups
                  </Link>
                </li>

                <li>
                  <Link
                    to="/"
                    className="text-[10px] md:text-[12px] lg:text-[14px] text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Categories
                  </Link>
                </li>
              </ul>
            </div>
            <div className="items-center text-center justify-center relative bottom-10  ">
              <Link
                to="/"
                className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white  block cursor-pointer"
              >
                UrConnections
              </Link>
              <p className="text-[10px] md:text-[12px] lg:text-[14px] text-center mx-auto text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs">
                A premium platform for focused communities and professional
                networking. Find your tribe, anywhere in the world.
              </p>
            </div>

            <div className="text-center mx-4">
              <h4 className="text-[10px] md:text-[12px] lg:text-[14px] font-bold text-center text-black dark:text-white mb-6 uppercase tracking-widest">
                Account
              </h4>
              <ul className="space-y-3">
                {user ? (
                  <>
                    <li>
                      <Link
                        to="/profile"
                        className="text-[10px] md:text-[12px] text-center lg:text-[14px] text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Profile
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleSignOut}
                        className="text-[10px] md:text-[12px] lg:text-[14px] text-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                        
                      >
                        Sign Out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="text-center">
                      <Link
                        to="/login"
                        className="text-[10px] md:text-[12px] lg:text-[14px] text-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Sign In
                      </Link>
                    </li>
                    <li className="text-center">
                      <Link
                        to="/login"
                        className="  text-[10px] md:text-[12px] lg:text-[14px] text-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                      >
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Copyright © 2026 UrConnections Inc. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                United States
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">
                English
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
