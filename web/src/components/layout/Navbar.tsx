import { Link, useLocation } from "react-router";
import { useSignOut, useUser } from "../../features/auth/hooks/useUser";
import { Avatar } from "../ui/Avatar";
import { ButtonLink } from "../ui/Button";

const navText = "text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-black dark:text-gray-400 dark:hover:text-white";

/** Sticky top bar: logo, account links, "Create Group". */
export default function Navbar() {
  const { pathname } = useLocation();
  const { data: user } = useUser();
  const { mutate: signOut } = useSignOut();

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-2xl transition-all duration-300 dark:border-raised-dark dark:bg-raised-dark/70">
      <div className="mx-auto flex h-(--nav-height) max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="mr-4 text-xl font-extrabold tracking-tighter text-black transition-opacity hover:opacity-70 dark:text-white sm:text-3xl">
          UrConnections
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <>
              {/* One link for picture + label (it used to be two links to the same page, B30). */}
              <Link to="/profile" className={`flex items-center gap-2 ${navText}`}>
                <Avatar user={user} />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button onClick={() => signOut()} className={`hidden sm:block ${navText}`}>
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className={navText}>
              Sign In
            </Link>
          )}

          {pathname === "/create" ? (
            <Link to="/" className="text-[13px] font-medium text-black transition-opacity hover:opacity-60 dark:text-white">
              Go Back
            </Link>
          ) : (
            <ButtonLink to="/create" size="xs" className="whitespace-nowrap">
              Create Group
            </ButtonLink>
          )}
        </div>
      </div>
    </nav>
  );
}
