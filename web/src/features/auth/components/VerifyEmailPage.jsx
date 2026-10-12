import { Link, useSearchParams } from "react-router-dom";
import { useVerifyEmail } from "../hooks/useEmailFlows";
import AuthCard, { buttonClass, Notice } from "./AuthCard";

/**
 * /verify-email?token=… (the link from the verification email).
 *
 * Why a button instead of verifying as soon as the page opens:
 *  - Mail security scanners (e.g. Outlook "Safe Links") open links before you do.
 *    A link that verified on open would be used up by the scanner.
 *  - React's StrictMode runs effects twice in development, which would send the
 *    one-time token twice and show an error.
 * A click is a deliberate POST: only a real person triggers it, exactly once.
 */
export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { mutate, isPending, isSuccess, error } = useVerifyEmail();

  if (isSuccess) {
    return (
      <AuthCard title="Email confirmed." subtitle="Thanks! You can now create groups.">
        <Link to="/" className={`${buttonClass} block text-center`}>Explore groups</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Confirm your email." subtitle="One click and your address is verified.">
      {!token && <Notice tone="error">This link is incomplete. Open the link from the email again.</Notice>}
      {error && <Notice tone="error">{error.message}</Notice>}
      <button onClick={() => mutate(token)} disabled={!token || isPending} className={buttonClass}>
        {isPending ? "Confirming…" : "Confirm my email"}
      </button>
    </AuthCard>
  );
}
