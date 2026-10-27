import { FaGoogle } from "react-icons/fa";
import { useSearchParams } from "react-router";
import { buttonClass } from "../../../components/ui/buttonClass";
import { withNext } from "../../../lib/nextPath";
import { GOOGLE_SIGN_IN_URL } from "../../../services/auth.service";

/** "Or continue with Google". On both the login and the sign-up page. */
export default function GoogleSignIn() {
  // The page that sent the user to sign in (?next=…): the API keeps it during the trip to
  // Google and redirects there afterwards (it checks it is a path on this site).
  const [searchParams] = useSearchParams();

  return (
    <>
      <div className="relative my-10 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100 dark:border-raised-dark" />
        </div>
        <span className="relative bg-white px-4 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:bg-black">
          Or continue with
        </span>
      </div>
      {/* A plain <a>, not a router Link or fetch(): the whole page travels to Google and back.
          The API answers with a redirect to Google; Google then redirects back to the API. */}
      <a href={withNext(GOOGLE_SIGN_IN_URL, searchParams.get("next"))} className={buttonClass({ variant: "outline", size: "lg", block: true })}>
        <FaGoogle aria-hidden /> Google
      </a>
    </>
  );
}
