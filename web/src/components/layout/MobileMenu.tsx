import { useEffect, useId, useRef } from "react";
import { Link, useLocation } from "react-router";
import { FiX } from "react-icons/fi";
import { useSignOut, useUser } from "../../features/auth/hooks/useUser";
import { useT } from "../../i18n/i18n";
import { withNext } from "../../lib/nextPath";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import LanguageSelect from "./LanguageSelect";

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;
}

const rowClass = "block rounded-2xl px-4 py-3 text-lg font-semibold tracking-tight text-black transition-colors hover:bg-surface dark:text-white dark:hover:bg-surface-dark";

/** Same breakpoint as Tailwind's `sm:`: from here up the navbar shows everything itself. */
const DESKTOP_QUERY = "(min-width: 40rem)";

/**
 * The phone menu (below `sm`): account links, sign-out and the language switch in a panel
 * that slides in from the right.
 *
 * Like ConfirmDialog, it is a native <dialog> opened with showModal(), so the browser
 * provides the hard parts: focus moves into the panel and stays there, Escape closes it,
 * the page behind can't be clicked, it is drawn above everything (no z-index fights with
 * the sticky navbar), and on close focus returns to the ☰ button that opened it.
 * The slide is CSS only: `starting:` gives the first frame's position, `transition-discrete`
 * lets the browser animate the switch to and from display:none.
 */
export default function MobileMenu({ id, open, onClose }: MobileMenuProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const { pathname, search } = useLocation();
  const { data: user } = useUser();
  const { mutate: signOut } = useSignOut();
  const { t } = useT();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Rotating a tablet or widening the window past `sm` hides the ☰ button; don't leave
  // an open menu behind that nothing on screen can close.
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const closeOnDesktop = () => {
      if (desktop.matches) onClose();
    };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open, onClose]);

  return (
    <dialog
      ref={ref}
      id={id}
      aria-labelledby={titleId}
      // Escape fires "cancel"; tell React's state instead of letting the dialog close itself.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // A click on the backdrop lands on the <dialog> itself (the panel's content fills it).
      // Any link inside closes the menu too: the clicked page opens with the menu gone.
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target instanceof Element && e.target.closest("a"))) onClose();
      }}
      className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-none w-[min(20rem,85vw)] max-w-none translate-x-full bg-white text-black shadow-2xl transition-[translate,display,overlay] transition-discrete duration-300 ease-out backdrop:bg-black/40 backdrop:backdrop-blur-sm open:translate-x-0 starting:open:translate-x-full motion-reduce:transition-none dark:bg-raised-dark dark:text-white sm:hidden"
    >
      <div className="flex h-full flex-col px-4 pb-6">
        <div className="flex h-(--nav-height) shrink-0 items-center justify-between pl-4">
          <h2 id={titleId} className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {t("nav.menu")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-2xl text-gray-500 transition-colors hover:bg-surface hover:text-black dark:text-gray-400 dark:hover:bg-surface-dark dark:hover:text-white"
          >
            <FiX aria-hidden />
          </button>
        </div>

        {user && (
          <Link to="/profile" className="mb-4 flex items-center gap-3 rounded-2xl bg-surface p-4 transition-opacity hover:opacity-80 dark:bg-surface-dark">
            <Avatar user={user} size="md" />
            <span className="min-w-0">
              <span className="block truncate font-semibold">{user.display_name || user.email}</span>
              <span className="block text-sm text-gray-500 dark:text-gray-400">{t("nav.profile")}</span>
            </span>
          </Link>
        )}

        <nav aria-labelledby={titleId}>
          <ul className="space-y-1">
            <li>
              <Link to="/" className={rowClass}>
                {t("nav.allGroups")}
              </Link>
            </li>
            <li>
              <Link to="/create" className={rowClass}>
                {t("nav.createGroup")}
              </Link>
            </li>
            {!user && (
              <>
                <li>
                  {/* After signing in, come back to this page (as the desktop navbar does). */}
                  <Link to={withNext("/login", pathname + search)} className={rowClass}>
                    {t("nav.signIn")}
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className={rowClass}>
                    {t("nav.register")}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        {/* mt-auto: language and sign-out sit at the bottom, within thumb reach. */}
        <div className="mt-auto space-y-4 border-t pt-4">
          <LanguageSelect variant="menu" />
          {user && (
            <Button
              variant="danger"
              size="sm"
              block
              onClick={() => {
                onClose();
                signOut();
              }}
            >
              {t("nav.signOut")}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  );
}
