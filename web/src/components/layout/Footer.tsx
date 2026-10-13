import type { ReactNode } from "react";
import { Link } from "react-router";
import { useSignOut, useUser } from "../../features/auth/hooks/useUser";

const linkClass = "text-xs text-gray-400 transition-colors hover:text-white md:text-sm";

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-4 text-center">
      <h2 className="mb-6 text-xs font-bold uppercase tracking-widest text-white md:text-sm">{title}</h2>
      <ul className="space-y-3">{children}</ul>
    </div>
  );
}

export default function Footer() {
  const { data: user } = useUser();
  const { mutate: signOut } = useSignOut();

  return (
    <footer className="w-full bg-black px-2 pb-5 pt-20 transition-colors duration-200 dark:bg-raised-dark">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-around">
          <Column title="Explore">
            <li>
              <Link to="/" className={linkClass}>
                All Groups
              </Link>
            </li>
            <li>
              <Link to="/create" className={linkClass}>
                Create a Group
              </Link>
            </li>
          </Column>

          <div className="relative bottom-10 text-center">
            <Link to="/" className="mb-6 block text-3xl font-extrabold text-white md:text-5xl lg:text-6xl">
              UrConnections
            </Link>
            <p className="mx-auto max-w-xs text-xs leading-relaxed text-gray-400 md:text-sm">
              A premium platform for focused communities and professional networking. Find your tribe, anywhere in the world.
            </p>
          </div>

          <Column title="Account">
            {user ? (
              <>
                <li>
                  <Link to="/profile" className={linkClass}>
                    Profile
                  </Link>
                </li>
                <li>
                  <button onClick={() => signOut()} className={linkClass}>
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className={linkClass}>
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className={linkClass}>
                    Register
                  </Link>
                </li>
              </>
            )}
          </Column>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-3 md:flex-row">
          <p className="text-xs text-gray-400 dark:text-gray-500">Copyright © 2026 UrConnections. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
