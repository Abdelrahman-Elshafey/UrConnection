import type { ReactNode } from "react";
import { Link } from "react-router";
import { useSignOut, useUser } from "../../features/auth/hooks/useUser";
import { useT } from "../../i18n/i18n";
import LanguageSelect from "./LanguageSelect";

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
  const { t } = useT();

  return (
    <footer className="w-full bg-black px-2 pb-5 pt-20 transition-colors duration-200 dark:bg-raised-dark">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-around">
          <Column title={t("footer.explore")}>
            <li>
              <Link to="/" className={linkClass}>
                {t("footer.allGroups")}
              </Link>
            </li>
            <li>
              <Link to="/create" className={linkClass}>
                {t("footer.createGroup")}
              </Link>
            </li>
          </Column>

          <div className="relative bottom-10 text-center">
            <Link to="/" className="mb-6 block text-3xl font-extrabold text-white md:text-5xl lg:text-6xl">
              UrConnections
            </Link>
            <p className="mx-auto max-w-xs text-xs leading-relaxed text-gray-400 md:text-sm">
              {t("footer.tagline")}
            </p>
          </div>

          <Column title={t("footer.account")}>
            {user ? (
              <>
                <li>
                  <Link to="/profile" className={linkClass}>
                    {t("footer.profile")}
                  </Link>
                </li>
                <li>
                  <button onClick={() => signOut()} className={linkClass}>
                    {t("footer.signOut")}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className={linkClass}>
                    {t("footer.signIn")}
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className={linkClass}>
                    {t("footer.register")}
                  </Link>
                </li>
              </>
            )}
          </Column>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-3 md:flex-row">
          <p className="text-xs text-gray-400 dark:text-gray-500">{t("footer.copyright", { year: 2026 })}</p>
          <LanguageSelect />
        </div>
      </div>
    </footer>
  );
}
